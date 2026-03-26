use std::{fmt, thread, time::Duration};

#[derive(Clone)]
pub struct McpClientConfig {
    pub server_name: String,
    pub search_documents_tool: String,
    pub get_document_info_tool: String,
    pub get_document_blocks_tool: String,
    pub get_image_resource_tool: String,
}

#[derive(Clone, Debug)]
pub struct RetryPolicy {
    pub max_attempts: u8,
    pub backoff_ms: u64,
}

#[derive(Clone, Debug)]
pub struct RawDocument {
    pub document_id: String,
    pub space_id: String,
    pub title: String,
    pub blocks: Vec<RawBlock>,
}

#[derive(Clone, Debug)]
pub enum RawBlock {
    Heading { level: u8, text: String },
    Paragraph { text: String },
    Image { media_id: String, alt: String },
}

#[derive(Clone, Debug)]
pub enum ImageResource {
    RemoteUrl(String),
    Binary(Vec<u8>),
}

#[derive(Clone, Debug)]
pub enum McpError {
    Transport(String),
    InvalidResponse(String),
}

impl fmt::Display for McpError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            McpError::Transport(message) => write!(f, "{message}"),
            McpError::InvalidResponse(message) => write!(f, "{message}"),
        }
    }
}

impl std::error::Error for McpError {}

pub struct FixtureMcpClient {
    pub config: McpClientConfig,
}

impl FixtureMcpClient {
    pub fn new(server_name: String) -> Self {
        Self {
            config: McpClientConfig {
                server_name,
                search_documents_tool: "search_feishu_documents".into(),
                get_document_info_tool: "get_feishu_document_info".into(),
                get_document_blocks_tool: "get_feishu_document_blocks".into(),
                get_image_resource_tool: "get_feishu_image_resource".into(),
            },
        }
    }

    pub fn fetch_document(&self, document_id: &str) -> Result<RawDocument, McpError> {
        let _tooling = (
            &self.config.server_name,
            &self.config.search_documents_tool,
            &self.config.get_document_info_tool,
            &self.config.get_document_blocks_tool,
            &self.config.get_image_resource_tool,
        );

        match document_id {
            "doc-eng-architecture" => Ok(RawDocument {
                document_id: document_id.into(),
                space_id: "kb-eng".into(),
                title: "研发架构设计".into(),
                blocks: vec![
                    RawBlock::Heading {
                        level: 1,
                        text: "研发架构设计".into(),
                    },
                    RawBlock::Paragraph {
                        text: "通过MCP获取知识库文档块并转换为规范化模型。".into(),
                    },
                ],
            }),
            "doc-eng-api" => Ok(RawDocument {
                document_id: document_id.into(),
                space_id: "kb-eng".into(),
                title: "研发API概览".into(),
                blocks: vec![
                    RawBlock::Heading {
                        level: 1,
                        text: "研发API概览".into(),
                    },
                    RawBlock::Paragraph {
                        text: "后续这里将替换为真实的Feishu文档块响应。".into(),
                    },
                    RawBlock::Image {
                        media_id: "img-eng-api".into(),
                        alt: "API图示".into(),
                    },
                ],
            }),
            "doc-product-overview" => Err(McpError::Transport("MCP request timeout".into())),
            "doc-product-roadmap" => Ok(RawDocument {
                document_id: document_id.into(),
                space_id: "kb-product".into(),
                title: "产品路线图".into(),
                blocks: vec![RawBlock::Paragraph {
                    text: "产品路线图文档".into(),
                }],
            }),
            "doc-ops-playbook" => Ok(RawDocument {
                document_id: document_id.into(),
                space_id: "kb-ops".into(),
                title: "运维值班手册".into(),
                blocks: vec![
                    RawBlock::Heading {
                        level: 1,
                        text: "运维值班手册".into(),
                    },
                    RawBlock::Paragraph {
                        text: "值班交接与处理流程".into(),
                    },
                ],
            }),
            _ => Err(McpError::InvalidResponse(format!(
                "Document `{document_id}` not found in fixture MCP transport"
            ))),
        }
    }

    pub fn fetch_image_resource(&self, media_id: &str) -> Result<ImageResource, McpError> {
        match media_id {
            "img-eng-api" => Ok(ImageResource::Binary(b"fixture-image-bytes".to_vec())),
            "img-ops-remote" => Ok(ImageResource::RemoteUrl(
                "https://example.feishu.cn/assets/ops-remote.png".into(),
            )),
            _ => Err(McpError::InvalidResponse(format!(
                "Image resource `{media_id}` not found in fixture MCP transport"
            ))),
        }
    }
}

pub fn fetch_with_retry(
    client: &FixtureMcpClient,
    document_id: &str,
    retry_policy: &RetryPolicy,
) -> Result<RawDocument, McpError> {
    let mut last_error: Option<McpError> = None;

    for attempt in 0..retry_policy.max_attempts.max(1) {
        match client.fetch_document(document_id) {
            Ok(document) => return Ok(document),
            Err(McpError::Transport(message)) => {
                last_error = Some(McpError::Transport(message));
                if attempt + 1 < retry_policy.max_attempts.max(1) {
                    thread::sleep(Duration::from_millis(retry_policy.backoff_ms));
                }
            }
            Err(error) => return Err(error),
        }
    }

    Err(last_error.unwrap_or_else(|| McpError::Transport("Unknown MCP transport failure".into())))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fetches_fixture_document_successfully() {
        let client = FixtureMcpClient::new("user-feishu-mcp".into());
        let result = fetch_with_retry(
            &client,
            "doc-eng-architecture",
            &RetryPolicy {
                max_attempts: 2,
                backoff_ms: 0,
            },
        )
        .expect("fixture document should load");

        assert_eq!(result.document_id, "doc-eng-architecture");
        assert_eq!(result.space_id, "kb-eng");
        assert!(!result.blocks.is_empty());
    }

    #[test]
    fn retries_transport_errors_and_returns_failure() {
        let client = FixtureMcpClient::new("user-feishu-mcp".into());
        let result = fetch_with_retry(
            &client,
            "doc-product-overview",
            &RetryPolicy {
                max_attempts: 2,
                backoff_ms: 0,
            },
        );

        assert!(matches!(result, Err(McpError::Transport(_))));
    }
}
