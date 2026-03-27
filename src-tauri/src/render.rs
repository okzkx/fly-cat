use crate::mcp::{ImageProvider, ImageResource, McpError};
use crate::model::{CanonicalBlock, CanonicalDocument, SyncSourceDocument};
use std::path::{Path, PathBuf};

pub struct RenderedDocument {
    pub markdown: String,
    pub image_assets: Vec<ImageAsset>,
}

pub struct ImageAsset {
    pub relative_path: String,
    pub bytes: Vec<u8>,
}

fn sanitize_path_segment(input: &str) -> String {
    let mut sanitized = String::new();

    for ch in input.chars() {
        let invalid = matches!(ch, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*') || ch.is_control();
        sanitized.push(if invalid { '_' } else { ch });
    }

    let trimmed = sanitized.trim().trim_end_matches(['.', ' ']).trim();
    if trimmed.is_empty() {
        "untitled".to_string()
    } else {
        trimmed.to_string()
    }
}

pub fn markdown_output_path(sync_root: &Path, document: &SyncSourceDocument) -> PathBuf {
    let mut output = sync_root.join(sanitize_path_segment(if document.space_name.is_empty() {
        &document.space_id
    } else {
        &document.space_name
    }));

    for segment in document.path_segments.iter().take(document.path_segments.len().saturating_sub(1)) {
        output = output.join(sanitize_path_segment(segment));
    }

    output.join(format!(
        "{}.md",
        sanitize_path_segment(document.path_segments.last().map(|segment| segment.as_str()).unwrap_or(&document.title))
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
    markdown_dir: &Path,
    image_dir_name: &str,
    image_provider: &impl ImageProvider,
) -> Result<RenderedDocument, McpError> {
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
                match image_provider.fetch_image_resource(media_id)? {
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
    use crate::model::{CanonicalBlock, CanonicalDocument, SyncSourceDocument};
    use std::path::PathBuf;

    #[test]
    fn creates_stable_markdown_path() {
        let document = SyncSourceDocument {
            document_id: "doc-eng-architecture".into(),
            space_id: "kb-eng".into(),
            space_name: "研发知识库".into(),
            node_token: "node-doc-eng-architecture".into(),
            title: "研发架构设计".into(),
            version: "v1".into(),
            update_time: "t1".into(),
            path_segments: vec!["研发规范".into(), "研发架构设计".into()],
            source_path: "研发知识库/研发规范/研发架构设计".into(),
        };

        let output = markdown_output_path(&PathBuf::from("synced-docs"), &document);
        let rendered = output.to_string_lossy().replace('\\', "/");
        assert!(rendered.contains("研发知识库/研发规范/研发架构设计.md"));
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
            Path::new("synced-docs/研发知识库/研发规范"),
            "_assets",
            &FixtureMcpClient::new("user-feishu-mcp".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("## 概览"));
        assert!(rendered.markdown.contains("_assets/"));
        assert_eq!(rendered.image_assets.len(), 1);
    }
}
