use crate::mcp::{ImageProvider, ImageResource, McpError};
use crate::model::{CanonicalBlock, CanonicalDocument, RichSegment, RichText, SyncSourceDocument};
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
        let invalid =
            matches!(ch, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*') || ch.is_control();
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

    for segment in document
        .path_segments
        .iter()
        .take(document.path_segments.len().saturating_sub(1))
    {
        output = output.join(sanitize_path_segment(segment));
    }

    output.join(format!(
        "{}.md",
        sanitize_path_segment(
            document
                .path_segments
                .last()
                .map(|segment| segment.as_str())
                .unwrap_or(&document.title)
        )
    ))
}

pub fn source_signature(document: &CanonicalDocument) -> String {
    format!(
        "{}:{}:{}",
        document.document_id,
        document.title,
        document.blocks.len()
    )
}

pub fn stable_hash(input: &[u8]) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in input {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}

/// Render a single styled segment as Markdown inline syntax.
fn render_segment(segment: &RichSegment) -> String {
    let mut text = segment.content.clone();

    if let Some(ref url) = segment.link {
        text = format!("[{}]({})", text, url);
    }
    if segment.strikethrough {
        text = format!("~~{text}~~");
    }
    if segment.bold && segment.italic {
        text = format!("***{text}***");
    } else if segment.bold {
        text = format!("**{text}**");
    } else if segment.italic {
        text = format!("*{text}*");
    }

    text
}

/// Render a RichText value as a Markdown inline string.
fn render_rich_text(rich: &RichText) -> String {
    rich.segments.iter().map(render_segment).collect()
}

pub fn render_markdown(
    document: &CanonicalDocument,
    markdown_dir: &Path,
    sync_root: &Path,
    image_dir_name: &str,
    image_provider: &impl ImageProvider,
) -> Result<RenderedDocument, McpError> {
    let mut lines = vec![format!("# {}", document.title), String::new()];
    let mut image_assets = Vec::new();

    for block in &document.blocks {
        match block {
            CanonicalBlock::Heading { level, text } => {
                let heading_level = (*level).clamp(1, 6);
                lines.push(format!("{} {}", "#".repeat(heading_level.into()), render_rich_text(text)));
                lines.push(String::new());
            }
            CanonicalBlock::Paragraph { text } => {
                lines.push(render_rich_text(text));
                lines.push(String::new());
            }
            CanonicalBlock::Image { media_id, alt } => {
                match image_provider.fetch_image_resource(media_id)? {
                    ImageResource::RemoteUrl(url) => {
                        lines.push(format!("![{}]({})", alt, url));
                    }
                    ImageResource::Binary { bytes, extension } => {
                        let hash = stable_hash(&bytes);
                        let image_dir = image_dir_name.trim_matches(['/', '\\']);
                        let relative_path = format!("{image_dir}/{hash}{extension}");
                        let absolute_path = sync_root.join(&relative_path);
                        let relative_link = relative_path_from(markdown_dir, &absolute_path);
                        lines.push(format!("![{}]({})", alt, relative_link));
                        image_assets.push(ImageAsset {
                            relative_path,
                            bytes,
                        });
                    }
                }
                lines.push(String::new());
            }
            CanonicalBlock::OrderedList { items } => {
                for (i, item) in items.iter().enumerate() {
                    lines.push(format!("{}. {}", i + 1, render_rich_text(item)));
                }
                lines.push(String::new());
            }
            CanonicalBlock::BulletList { items } => {
                for item in items {
                    lines.push(format!("- {}", render_rich_text(item)));
                }
                lines.push(String::new());
            }
            CanonicalBlock::CodeBlock { language, code } => {
                lines.push(format!("```{}", language));
                lines.push(code.clone());
                lines.push("```".to_string());
                lines.push(String::new());
            }
            CanonicalBlock::Quote { text } => {
                let rendered = render_rich_text(text);
                for line in rendered.lines() {
                    lines.push(format!("> {}", line));
                }
                lines.push(String::new());
            }
            CanonicalBlock::Table { rows } => {
                if !rows.is_empty() {
                    // First row is the header
                    let header = &rows[0];
                    let col_count = header.len();
                    let header_rendered: Vec<String> =
                        header.iter().map(render_rich_text).collect();
                    lines.push(format!(
                        "| {} |",
                        header_rendered.join(" | ")
                    ));
                    lines.push(format!(
                        "| {} |",
                        (0..col_count)
                            .map(|_| "---")
                            .collect::<Vec<_>>()
                            .join(" | ")
                    ));
                    // Remaining rows are body
                    for row in rows.iter().skip(1) {
                        let rendered_cells: Vec<String> =
                            row.iter().map(render_rich_text).collect();
                        // Pad row to col_count if needed
                        let padded: Vec<String> = rendered_cells
                            .into_iter()
                            .chain(std::iter::repeat(String::new()))
                            .take(col_count)
                            .collect();
                        lines.push(format!("| {} |", padded.join(" | ")));
                    }
                    lines.push(String::new());
                }
            }
            CanonicalBlock::Divider => {
                lines.push("---".to_string());
                lines.push(String::new());
            }
            CanonicalBlock::Todo { items } => {
                for (done, text) in items {
                    let check = if *done { "x" } else { " " };
                    lines.push(format!("- [{}] {}", check, render_rich_text(text)));
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

fn relative_path_from(base: &Path, target: &Path) -> String {
    let base_components = base.components().collect::<Vec<_>>();
    let target_components = target.components().collect::<Vec<_>>();

    let mut common = 0usize;
    while common < base_components.len()
        && common < target_components.len()
        && base_components[common] == target_components[common]
    {
        common += 1;
    }

    if common == 0 {
        return target.to_string_lossy().replace('\\', "/");
    }

    let mut relative = PathBuf::new();
    for _ in common..base_components.len() {
        relative.push("..");
    }
    for component in &target_components[common..] {
        relative.push(component.as_os_str());
    }

    let rendered = relative.to_string_lossy().replace('\\', "/");
    if rendered.is_empty() {
        ".".into()
    } else {
        rendered
    }
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
            obj_type: String::new(),
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
            Path::new("synced-docs"),
            "_assets",
            &FixtureMcpClient::new("user-feishu-mcp".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("## 概览"));
        assert!(rendered.markdown.contains("../_assets/"));
        assert_eq!(rendered.image_assets.len(), 1);
    }

    // --- New block type rendering tests ---

    #[test]
    fn renders_ordered_list_with_numbering() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "有序列表测试".into(),
            blocks: vec![
                CanonicalBlock::Heading {
                    level: 2,
                    text: "步骤".into(),
                },
                CanonicalBlock::OrderedList {
                    items: vec![
                        "第一步".into(),
                        "第二步".into(),
                        "第三步".into(),
                    ],
                },
            ],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("1. 第一步"));
        assert!(rendered.markdown.contains("2. 第二步"));
        assert!(rendered.markdown.contains("3. 第三步"));
    }

    #[test]
    fn renders_bullet_list_with_dashes() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "无序列表测试".into(),
            blocks: vec![CanonicalBlock::BulletList {
                items: vec!["苹果".into(), "香蕉".into()],
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("- 苹果"));
        assert!(rendered.markdown.contains("- 香蕉"));
    }

    #[test]
    fn renders_code_block_with_language() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "代码块测试".into(),
            blocks: vec![CanonicalBlock::CodeBlock {
                language: "rust".into(),
                code: "fn main() { println!(\"hello\"); }".into(),
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("```rust"));
        assert!(rendered.markdown.contains("fn main()"));
        assert!(rendered.markdown.contains("```"));
    }

    #[test]
    fn renders_quote_block_with_prefix() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "引用测试".into(),
            blocks: vec![CanonicalBlock::Quote {
                text: "这是一段引用文字".into(),
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("> 这是一段引用文字"));
    }

    #[test]
    fn renders_multiline_quote() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "多行引用".into(),
            blocks: vec![CanonicalBlock::Quote {
                text: "第一行\n第二行".into(),
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("> 第一行"));
        assert!(rendered.markdown.contains("> 第二行"));
    }

    #[test]
    fn renders_table_with_header_and_body() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "表格测试".into(),
            blocks: vec![CanonicalBlock::Table {
                rows: vec![
                    vec!["名称".into(), "类型".into()],
                    vec!["Alice".into(), "用户".into()],
                    vec!["Bob".into(), "管理员".into()],
                ],
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("| 名称 | 类型 |"));
        assert!(rendered.markdown.contains("| --- | --- |"));
        assert!(rendered.markdown.contains("| Alice | 用户 |"));
        assert!(rendered.markdown.contains("| Bob | 管理员 |"));
    }

    #[test]
    fn renders_divider() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "分割线测试".into(),
            blocks: vec![
                CanonicalBlock::Paragraph {
                    text: "上部分".into(),
                },
                CanonicalBlock::Divider,
                CanonicalBlock::Paragraph {
                    text: "下部分".into(),
                },
            ],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("---"));
        assert!(rendered.markdown.contains("上部分"));
        assert!(rendered.markdown.contains("下部分"));
    }

    #[test]
    fn renders_todo_list_with_checkboxes() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "待办列表测试".into(),
            blocks: vec![CanonicalBlock::Todo {
                items: vec![
                    (false, RichText::plain("待完成任务")),
                    (true, RichText::plain("已完成任务")),
                ],
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("- [ ] 待完成任务"));
        assert!(rendered.markdown.contains("- [x] 已完成任务"));
    }

    // --- Rich text inline style rendering tests ---

    #[test]
    fn renders_bold_text() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "粗体测试".into(),
            blocks: vec![CanonicalBlock::Paragraph {
                text: RichText {
                    segments: vec![RichSegment {
                        content: "bold text".into(),
                        bold: true,
                        italic: false,
                        strikethrough: false,
                        link: None,
                    }],
                },
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("**bold text**"));
    }

    #[test]
    fn renders_italic_text() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "斜体测试".into(),
            blocks: vec![CanonicalBlock::Paragraph {
                text: RichText {
                    segments: vec![RichSegment {
                        content: "italic text".into(),
                        bold: false,
                        italic: true,
                        strikethrough: false,
                        link: None,
                    }],
                },
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("*italic text*"));
    }

    #[test]
    fn renders_strikethrough_text() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "删除线测试".into(),
            blocks: vec![CanonicalBlock::Paragraph {
                text: RichText {
                    segments: vec![RichSegment {
                        content: "deleted".into(),
                        bold: false,
                        italic: false,
                        strikethrough: true,
                        link: None,
                    }],
                },
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("~~deleted~~"));
    }

    #[test]
    fn renders_link_text() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "链接测试".into(),
            blocks: vec![CanonicalBlock::Paragraph {
                text: RichText {
                    segments: vec![RichSegment {
                        content: "click here".into(),
                        bold: false,
                        italic: false,
                        strikethrough: false,
                        link: Some("https://example.com".into()),
                    }],
                },
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("[click here](https://example.com)"));
    }

    #[test]
    fn renders_bold_italic_combined() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "组合样式".into(),
            blocks: vec![CanonicalBlock::Paragraph {
                text: RichText {
                    segments: vec![RichSegment {
                        content: "both".into(),
                        bold: true,
                        italic: true,
                        strikethrough: false,
                        link: None,
                    }],
                },
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("***both***"));
    }

    #[test]
    fn renders_mixed_segments_in_paragraph() {
        let document = CanonicalDocument {
            document_id: "doc-test".into(),
            space_id: "kb-test".into(),
            title: "混合段落".into(),
            blocks: vec![CanonicalBlock::Paragraph {
                text: RichText {
                    segments: vec![
                        RichSegment {
                            content: "normal ".into(),
                            bold: false,
                            italic: false,
                            strikethrough: false,
                            link: None,
                        },
                        RichSegment {
                            content: "bold".into(),
                            bold: true,
                            italic: false,
                            strikethrough: false,
                            link: None,
                        },
                        RichSegment {
                            content: " end".into(),
                            bold: false,
                            italic: false,
                            strikethrough: false,
                            link: None,
                        },
                    ],
                },
            }],
        };

        let rendered = render_markdown(
            &document,
            Path::new("out"),
            Path::new("out"),
            "_assets",
            &FixtureMcpClient::new("test".into()),
        )
        .expect("render should succeed");

        assert!(rendered.markdown.contains("normal **bold** end"));
    }
}
