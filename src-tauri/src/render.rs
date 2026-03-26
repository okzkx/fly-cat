use crate::mcp::{FixtureMcpClient, ImageResource, McpError};
use crate::model::{CanonicalBlock, CanonicalDocument};
use std::path::{Path, PathBuf};

pub struct RenderedDocument {
    pub markdown: String,
    pub image_assets: Vec<ImageAsset>,
}

pub struct ImageAsset {
    pub relative_path: String,
    pub bytes: Vec<u8>,
}

fn slugify(input: &str) -> String {
    let mut result = String::new();
    let mut previous_was_dash = false;

    for ch in input.chars() {
        if ch.is_ascii_alphanumeric() {
            result.push(ch.to_ascii_lowercase());
            previous_was_dash = false;
        } else if !previous_was_dash {
            result.push('-');
            previous_was_dash = true;
        }
    }

    result.trim_matches('-').to_string()
}

fn short_document_suffix(document_id: &str) -> String {
    document_id
        .chars()
        .filter(|ch| ch.is_ascii_alphanumeric())
        .take(8)
        .collect::<String>()
}

pub fn markdown_output_path(sync_root: &Path, document: &CanonicalDocument) -> PathBuf {
    let slug = {
        let base = slugify(&document.title);
        if base.is_empty() {
            "untitled".to_string()
        } else {
            base
        }
    };
    sync_root.join(&document.space_id).join(format!(
        "{}-{}.md",
        slug,
        short_document_suffix(&document.document_id)
    ))
}

pub fn source_signature(document: &CanonicalDocument) -> String {
    format!("{}:{}:{}", document.document_id, document.title, document.blocks.len())
}

pub fn stable_hash(input: &[u8]) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in input {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}

pub fn render_markdown(
    document: &CanonicalDocument,
    sync_root: &Path,
    image_dir_name: &str,
    mcp_client: &FixtureMcpClient,
) -> Result<RenderedDocument, McpError> {
    let markdown_path = markdown_output_path(sync_root, document);
    let markdown_dir = markdown_path.parent().unwrap_or(sync_root);
    let mut lines = vec![format!("# {}", document.title), String::new()];
    let mut image_assets = Vec::new();

    for block in &document.blocks {
        match block {
            CanonicalBlock::Heading { level, text } => {
                let heading_level = (*level).clamp(1, 6);
                lines.push(format!("{} {}", "#".repeat(heading_level.into()), text));
                lines.push(String::new());
            }
            CanonicalBlock::Paragraph { text } => {
                lines.push(text.clone());
                lines.push(String::new());
            }
            CanonicalBlock::Image { media_id, alt } => {
                match mcp_client.fetch_image_resource(media_id)? {
                    ImageResource::RemoteUrl(url) => {
                        lines.push(format!("![{}]({})", alt, url));
                    }
                    ImageResource::Binary(bytes) => {
                        let hash = stable_hash(&bytes);
                        let relative_path = format!("{}/{}.png", image_dir_name, hash);
                        let absolute_path = markdown_dir.join(&relative_path);
                        let relative_link = pathdiff(markdown_dir, &absolute_path);
                        lines.push(format!("![{}]({})", alt, relative_link));
                        image_assets.push(ImageAsset { relative_path, bytes });
                    }
                }
                lines.push(String::new());
            }
            CanonicalBlock::Unknown { raw_type } => {
                lines.push(format!("<!-- Unsupported block type: {} -->", raw_type));
                lines.push(String::new());
            }
        }
    }

    Ok(RenderedDocument {
        markdown: format!("{}\n", lines.join("\n").trim_end()),
        image_assets,
    })
}

fn pathdiff(base: &Path, target: &Path) -> String {
    target
        .strip_prefix(base)
        .map(|path| path.to_string_lossy().replace('\\', "/"))
        .unwrap_or_else(|_| target.to_string_lossy().replace('\\', "/"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mcp::FixtureMcpClient;
    use crate::model::{CanonicalBlock, CanonicalDocument};
    use std::path::PathBuf;

    #[test]
    fn creates_stable_markdown_path() {
        let document = CanonicalDocument {
            document_id: "doc-eng-architecture".into(),
            space_id: "kb-eng".into(),
            title: "研发架构设计".into(),
            blocks: vec![],
        };

        let output = markdown_output_path(&PathBuf::from("synced-docs"), &document);
        assert!(output.to_string_lossy().contains("kb-eng"));
        assert!(output.to_string_lossy().ends_with(".md"));
    }

    #[test]
    fn renders_markdown_with_local_image_fallback() {
        let document = CanonicalDocument {
            document_id: "doc-eng-api".into(),
            space_id: "kb-eng".into(),
            title: "研发API概览".into(),
            blocks: vec![
                CanonicalBlock::Heading {
                    level: 2,
                    text: "概览".into(),
                },
                CanonicalBlock::Image {
                    media_id: "img-eng-api".into(),
                    alt: "接口图".into(),
                },
            ],
        };

        let rendered = render_markdown(
            &document,
            Path::new("synced-docs"),
            "_assets",
            &FixtureMcpClient::new("user-feishu-mcp".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("## 概览"));
        assert!(rendered.markdown.contains("_assets/"));
        assert_eq!(rendered.image_assets.len(), 1);
    }
}
