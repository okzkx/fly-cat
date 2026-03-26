use serde_json::{json, Value};
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

fn extract_openapi_error(value: &Value, context: &str) -> Option<McpError> {
    let code = value.get("code").and_then(|value| value.as_i64()).unwrap_or(0);
    if code == 0 {
        return None;
    }
    let msg = value
        .get("msg")
        .and_then(|value| value.as_str())
        .unwrap_or("unknown error");
    Some(McpError::Transport(format!("{context}失败(code={code}): {msg}")))
}

#[derive(Clone, Debug)]
pub struct FeishuOpenApiConfig {
    pub app_id: String,
    pub app_secret: String,
    pub endpoint: String,
}

#[derive(Clone, Debug)]
pub struct FeishuSpace {
    pub space_id: String,
    pub name: String,
}

#[derive(Clone, Debug)]
pub struct FeishuWikiNode {
    pub space_id: String,
    pub node_token: String,
    pub obj_token: String,
    pub obj_type: String,
    pub title: String,
    pub has_child: bool,
}

pub trait ImageProvider {
    fn fetch_image_resource(&self, media_id: &str) -> Result<ImageResource, McpError>;
}

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

impl ImageProvider for FixtureMcpClient {
    fn fetch_image_resource(&self, media_id: &str) -> Result<ImageResource, McpError> {
        self.fetch_image_resource(media_id)
    }
}

pub struct FeishuOpenApiClient {
    config: FeishuOpenApiConfig,
}

impl FeishuOpenApiClient {
    pub fn new(config: FeishuOpenApiConfig) -> Self {
        Self { config }
    }

    fn endpoint(&self, path: &str) -> String {
        format!("{}/{}", self.config.endpoint.trim_end_matches('/'), path.trim_start_matches('/'))
    }

    fn tenant_access_token(&self) -> Result<String, McpError> {
        let response = ureq::post(&self.endpoint("/auth/v3/tenant_access_token/internal"))
            .send_json(json!({
                "app_id": self.config.app_id,
                "app_secret": self.config.app_secret
            }))
            .map_err(|err| McpError::Transport(format!("Tenant token request failed: {err}")))?;

        let value: Value = response
            .into_json()
            .map_err(|err| McpError::InvalidResponse(format!("Invalid tenant token response: {err}")))?;

        if let Some(error) = extract_openapi_error(&value, "获取tenant_access_token") {
            return Err(error);
        }

        value
            .get("tenant_access_token")
            .and_then(|value| value.as_str())
            .map(|token| token.to_string())
            .ok_or_else(|| {
                McpError::InvalidResponse(
                    "获取tenant_access_token失败: 响应中缺少tenant_access_token，请检查App ID/App Secret是否正确".into(),
                )
            })
    }

    pub fn list_spaces(&self) -> Result<Vec<FeishuSpace>, McpError> {
        let token = self.tenant_access_token()?;
        let response = ureq::get(&self.endpoint("/wiki/v2/spaces"))
            .set("Authorization", &format!("Bearer {token}"))
            .query("page_size", "50")
            .call()
            .map_err(|err| McpError::Transport(format!("List spaces request failed: {err}")))?;

        let value: Value = response
            .into_json()
            .map_err(|err| McpError::InvalidResponse(format!("Invalid spaces response: {err}")))?;

        if let Some(error) = extract_openapi_error(&value, "获取知识空间列表") {
            return Err(error);
        }

        let items = value
            .get("data")
            .and_then(|data| data.get("items"))
            .and_then(|items| items.as_array())
            .ok_or_else(|| McpError::InvalidResponse("Space list missing items".into()))?;

        Ok(items
            .iter()
            .filter_map(|item| {
                Some(FeishuSpace {
                    space_id: item.get("space_id")?.as_str()?.to_string(),
                    name: item.get("name")?.as_str()?.to_string(),
                })
            })
            .collect())
    }

    pub fn list_child_nodes(&self, space_id: &str, parent_node_token: Option<&str>) -> Result<Vec<FeishuWikiNode>, McpError> {
        let token = self.tenant_access_token()?;
        let mut request = ureq::get(&self.endpoint(&format!("/wiki/v2/spaces/{space_id}/nodes")))
            .set("Authorization", &format!("Bearer {token}"))
            .query("page_size", "50");

        if let Some(parent) = parent_node_token {
            request = request.query("parent_node_token", parent);
        }

        let response = request
            .call()
            .map_err(|err| McpError::Transport(format!("List child nodes request failed: {err}")))?;

        let value: Value = response
            .into_json()
            .map_err(|err| McpError::InvalidResponse(format!("Invalid child node response: {err}")))?;

        if let Some(error) = extract_openapi_error(&value, "获取知识空间子节点列表") {
            return Err(error);
        }

        let items = value
            .get("data")
            .and_then(|data| data.get("items"))
            .and_then(|items| items.as_array())
            .ok_or_else(|| McpError::InvalidResponse("Wiki node list missing items".into()))?;

        Ok(items
            .iter()
            .filter_map(|item| {
                Some(FeishuWikiNode {
                    space_id: item.get("space_id")?.as_str()?.to_string(),
                    node_token: item.get("node_token")?.as_str()?.to_string(),
                    obj_token: item.get("obj_token")?.as_str()?.to_string(),
                    obj_type: item.get("obj_type")?.as_str()?.to_string(),
                    title: item.get("title")?.as_str()?.to_string(),
                    has_child: item.get("has_child").and_then(|v| v.as_bool()).unwrap_or(false),
                })
            })
            .collect())
    }

    pub fn fetch_document(&self, document_id: &str) -> Result<RawDocument, McpError> {
        let token = self.tenant_access_token()?;
        let info_response = ureq::get(&self.endpoint(&format!("/docx/v1/documents/{document_id}")))
            .set("Authorization", &format!("Bearer {token}"))
            .call()
            .map_err(|err| McpError::Transport(format!("Document info request failed: {err}")))?;

        let info_value: Value = info_response
            .into_json()
            .map_err(|err| McpError::InvalidResponse(format!("Invalid document info response: {err}")))?;

        if let Some(error) = extract_openapi_error(&info_value, "获取文档信息") {
            return Err(error);
        }

        let title = info_value
            .get("data")
            .and_then(|data| data.get("document"))
            .and_then(|document| document.get("title"))
            .and_then(|value| value.as_str())
            .unwrap_or(document_id)
            .to_string();

        let raw_response = ureq::get(&self.endpoint(&format!("/docx/v1/documents/{document_id}/raw_content")))
            .set("Authorization", &format!("Bearer {token}"))
            .call()
            .map_err(|err| McpError::Transport(format!("Document raw_content request failed: {err}")))?;

        let raw_value: Value = raw_response
            .into_json()
            .map_err(|err| McpError::InvalidResponse(format!("Invalid raw_content response: {err}")))?;

        if let Some(error) = extract_openapi_error(&raw_value, "获取文档原始内容") {
            return Err(error);
        }

        let raw_text = raw_value
            .get("data")
            .and_then(|data| data.get("content"))
            .and_then(|value| value.as_str())
            .ok_or_else(|| McpError::InvalidResponse("raw_content missing content".into()))?;

        let blocks = raw_text
            .lines()
            .filter(|line| !line.trim().is_empty())
            .map(|line| RawBlock::Paragraph {
                text: line.to_string(),
            })
            .collect::<Vec<_>>();

        Ok(RawDocument {
            document_id: document_id.to_string(),
            space_id: "wiki-openapi".into(),
            title,
            blocks: if blocks.is_empty() {
                vec![RawBlock::Paragraph {
                    text: raw_text.to_string(),
                }]
            } else {
                blocks
            },
        })
    }
}

impl ImageProvider for FeishuOpenApiClient {
    fn fetch_image_resource(&self, media_id: &str) -> Result<ImageResource, McpError> {
        Ok(ImageResource::RemoteUrl(format!(
            "{}/open-apis/drive/v1/medias/{}",
            self.config.endpoint.trim_end_matches('/'),
            media_id
        )))
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

pub fn fetch_openapi_with_retry(
    client: &FeishuOpenApiClient,
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

    Err(last_error.unwrap_or_else(|| McpError::Transport("Unknown Feishu OpenAPI failure".into())))
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
