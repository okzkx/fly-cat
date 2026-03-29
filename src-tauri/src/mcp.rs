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

const FEISHU_TOKEN_ENDPOINT: &str = "https://passport.feishu.cn/suite/passport/oauth/token";

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

fn status_error_from_response(response: ureq::Response, context: &str) -> McpError {
    let status = response.status();
    match response.into_json::<Value>() {
        Ok(value) => extract_openapi_error(&value, context).unwrap_or_else(|| {
            let msg = value
                .get("msg")
                .and_then(|value| value.as_str())
                .unwrap_or("unknown error");
            McpError::Transport(format!("{context}失败(status={status}): {msg}"))
        }),
        Err(err) => McpError::Transport(format!("{context}失败(status={status}): {err}")),
    }
}

fn call_openapi_json(request: ureq::Request, context: &str) -> Result<Value, McpError> {
    let response = match request.call() {
        Ok(response) => response,
        Err(ureq::Error::Status(_, response)) => return Err(status_error_from_response(response, context)),
        Err(err) => return Err(McpError::Transport(format!("{context}请求失败: {err}"))),
    };

    response
        .into_json()
        .map_err(|err| McpError::InvalidResponse(format!("{context}响应格式无效: {err}")))
}

fn extract_oauth_error(value: &Value, context: &str) -> Option<McpError> {
    if let Some(error) = value.get("error").and_then(|value| value.as_str()) {
        let description = value
            .get("error_description")
            .and_then(|value| value.as_str())
            .unwrap_or("unknown oauth error");
        return Some(McpError::Transport(format!("{context}失败: {error}: {description}")));
    }

    extract_openapi_error(value, context)
}

#[derive(Clone, Debug)]
pub struct FeishuOpenApiConfig {
    pub endpoint: String,
    pub access_token: String,
}

#[derive(Clone, Debug)]
pub struct FeishuOAuthTokenInfo {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub refresh_expires_in: i64,
    pub refresh_token: String,
    pub scope: String,
}

#[derive(Clone, Debug)]
pub struct FeishuAuthorizedUser {
    pub name: String,
    pub avatar: Option<String>,
    pub email: Option<String>,
    pub user_id: Option<String>,
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

#[derive(Clone, Debug)]
pub struct FeishuDocumentSummary {
    pub title: String,
    pub version: String,
    pub update_time: String,
}

pub trait ImageProvider {
    fn fetch_image_resource(&self, media_id: &str) -> Result<ImageResource, McpError>;
}

fn parse_token_info(value: Value, context: &str) -> Result<FeishuOAuthTokenInfo, McpError> {
    if let Some(error) = extract_oauth_error(&value, context) {
        return Err(error);
    }

    Ok(FeishuOAuthTokenInfo {
        access_token: value
            .get("access_token")
            .and_then(|value| value.as_str())
            .ok_or_else(|| McpError::InvalidResponse(format!("{context}响应缺少 access_token")))?
            .to_string(),
        token_type: value
            .get("token_type")
            .and_then(|value| value.as_str())
            .unwrap_or("Bearer")
            .to_string(),
        expires_in: value.get("expires_in").and_then(|value| value.as_i64()).unwrap_or(0),
        refresh_expires_in: value
            .get("refresh_expires_in")
            .and_then(|value| value.as_i64())
            .unwrap_or(0),
        refresh_token: value
            .get("refresh_token")
            .and_then(|value| value.as_str())
            .ok_or_else(|| McpError::InvalidResponse(format!("{context}响应缺少 refresh_token")))?
            .to_string(),
        scope: value
            .get("scope")
            .and_then(|value| value.as_str())
            .unwrap_or_default()
            .to_string(),
    })
}

pub fn exchange_user_access_token(
    app_id: &str,
    app_secret: &str,
    code: &str,
    redirect_uri: &str,
) -> Result<FeishuOAuthTokenInfo, McpError> {
    let scope = "docs:doc docs:document.media:download docs:document:export docx:document drive:drive drive:file drive:file:download offline_access";
    let response = ureq::post(FEISHU_TOKEN_ENDPOINT)
        .send_json(json!({
            "grant_type": "authorization_code",
            "client_id": app_id,
            "client_secret": app_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "scope": scope,
        }))
        .map_err(|err| McpError::Transport(format!("OAuth token request failed: {err}")))?;

    let value: Value = response
        .into_json()
        .map_err(|err| McpError::InvalidResponse(format!("Invalid OAuth token response: {err}")))?;

    parse_token_info(value, "获取用户 access_token")
}

pub fn refresh_user_access_token(
    app_id: &str,
    app_secret: &str,
    refresh_token: &str,
) -> Result<FeishuOAuthTokenInfo, McpError> {
    let response = ureq::post(FEISHU_TOKEN_ENDPOINT)
        .send_json(json!({
            "grant_type": "refresh_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "refresh_token": refresh_token,
        }))
        .map_err(|err| McpError::Transport(format!("OAuth refresh request failed: {err}")))?;

    let value: Value = response
        .into_json()
        .map_err(|err| McpError::InvalidResponse(format!("Invalid OAuth refresh response: {err}")))?;

    parse_token_info(value, "刷新用户 access_token")
}

pub fn fetch_user_info(endpoint: &str, access_token: &str) -> Result<FeishuAuthorizedUser, McpError> {
    let endpoint = format!("{}/{}", endpoint.trim_end_matches('/'), "authen/v1/user_info");
    let value = call_openapi_json(
        ureq::get(&endpoint)
        .set("Authorization", &format!("Bearer {access_token}"))
        ,
        "获取用户信息",
    )?;

    if let Some(error) = extract_openapi_error(&value, "获取用户信息") {
        return Err(error);
    }

    let data = value
        .get("data")
        .ok_or_else(|| McpError::InvalidResponse("User info response missing data".into()))?;

    Ok(FeishuAuthorizedUser {
        name: data
            .get("name")
            .and_then(|value| value.as_str())
            .unwrap_or("飞书用户")
            .to_string(),
        avatar: data
            .get("avatar_thumb")
            .and_then(|value| value.as_str())
            .or_else(|| data.get("avatar_url").and_then(|value| value.as_str()))
            .map(|value| value.to_string()),
        email: data
            .get("email")
            .and_then(|value| value.as_str())
            .map(|value| value.to_string()),
        user_id: data
            .get("user_id")
            .and_then(|value| value.as_str())
            .map(|value| value.to_string()),
    })
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

fn value_to_string(value: Option<&Value>) -> Option<String> {
    value.and_then(|value| {
        value
            .as_str()
            .map(|value| value.to_string())
            .or_else(|| value.as_i64().map(|value| value.to_string()))
            .or_else(|| value.as_u64().map(|value| value.to_string()))
    })
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

    fn access_token(&self) -> Result<&str, McpError> {
        if self.config.access_token.trim().is_empty() {
            return Err(McpError::Transport("Missing user access token".into()));
        }

        Ok(self.config.access_token.as_str())
    }

    pub fn list_spaces(&self) -> Result<Vec<FeishuSpace>, McpError> {
        let token = self.access_token()?;
        let mut page_token: Option<String> = None;
        let mut spaces = Vec::new();

        loop {
            let mut request = ureq::get(&self.endpoint("/wiki/v2/spaces"))
                .set("Authorization", &format!("Bearer {token}"))
                .query("page_size", "50")
                .query("user_id_type", "user_id");

            if let Some(current_page_token) = page_token.as_deref() {
                request = request.query("page_token", current_page_token);
            }

            let value = call_openapi_json(request, "获取知识空间列表")?;

            if let Some(error) = extract_openapi_error(&value, "获取知识空间列表") {
                return Err(error);
            }

            let data = value
                .get("data")
                .ok_or_else(|| McpError::InvalidResponse("Space list missing data".into()))?;
            let items = data
                .get("items")
                .and_then(|items| items.as_array())
                .ok_or_else(|| McpError::InvalidResponse("Space list missing items".into()))?;

            spaces.extend(items.iter().filter_map(|item| {
                Some(FeishuSpace {
                    space_id: item.get("space_id")?.as_str()?.to_string(),
                    name: item.get("name")?.as_str()?.to_string(),
                })
            }));

            let has_more = data
                .get("has_more")
                .and_then(|value| value.as_bool())
                .unwrap_or(false);
            if !has_more {
                break;
            }

            page_token = data
                .get("page_token")
                .and_then(|value| value.as_str())
                .map(|value| value.to_string());

            if page_token.is_none() {
                break;
            }
        }

        Ok(spaces)
    }

    pub fn fetch_document_summary(&self, document_id: &str) -> Result<FeishuDocumentSummary, McpError> {
        let token = self.access_token()?;
        let info_value = call_openapi_json(
            ureq::get(&self.endpoint(&format!("/docx/v1/documents/{document_id}")))
                .set("Authorization", &format!("Bearer {token}")),
            "获取文档信息",
        )?;

        if let Some(error) = extract_openapi_error(&info_value, "获取文档信息") {
            return Err(error);
        }

        let document = info_value
            .get("data")
            .and_then(|data| data.get("document"))
            .ok_or_else(|| McpError::InvalidResponse("Document info missing document".into()))?;

        let title = value_to_string(document.get("title"))
            .unwrap_or_else(|| document_id.to_string());
        let version = value_to_string(document.get("revision_id"))
            .or_else(|| value_to_string(document.get("revision")))
            .or_else(|| value_to_string(document.get("version")))
            .or_else(|| value_to_string(document.get("obj_edit_time")))
            .or_else(|| value_to_string(document.get("update_time")))
            .unwrap_or_else(|| title.clone());
        let update_time = value_to_string(document.get("obj_edit_time"))
            .or_else(|| value_to_string(document.get("update_time")))
            .or_else(|| value_to_string(document.get("updated_at")))
            .or_else(|| value_to_string(document.get("edit_time")))
            .unwrap_or_else(|| version.clone());

        Ok(FeishuDocumentSummary {
            title,
            version,
            update_time,
        })
    }

    pub fn list_child_nodes(&self, space_id: &str, parent_node_token: Option<&str>) -> Result<Vec<FeishuWikiNode>, McpError> {
        let token = self.access_token()?;
        let mut page_token: Option<String> = None;
        let mut nodes = Vec::new();

        loop {
            let mut request = ureq::get(&self.endpoint(&format!("/wiki/v2/spaces/{space_id}/nodes")))
                .set("Authorization", &format!("Bearer {token}"))
                .query("page_size", "50")
                .query("user_id_type", "user_id");

            if let Some(parent) = parent_node_token {
                request = request.query("parent_node_token", parent);
            }
            if let Some(current_page_token) = page_token.as_deref() {
                request = request.query("page_token", current_page_token);
            }

            let value = call_openapi_json(request, "获取知识空间子节点列表")?;

            if let Some(error) = extract_openapi_error(&value, "获取知识空间子节点列表") {
                return Err(error);
            }

            let data = value
                .get("data")
                .ok_or_else(|| McpError::InvalidResponse("Wiki node list missing data".into()))?;
            let items = data
                .get("items")
                .and_then(|items| items.as_array())
                .ok_or_else(|| McpError::InvalidResponse("Wiki node list missing items".into()))?;

            nodes.extend(items.iter().filter_map(|item| {
                Some(FeishuWikiNode {
                    space_id: item.get("space_id")?.as_str()?.to_string(),
                    node_token: item.get("node_token")?.as_str()?.to_string(),
                    obj_token: item.get("obj_token")?.as_str()?.to_string(),
                    obj_type: item.get("obj_type")?.as_str()?.to_string(),
                    title: item.get("title")?.as_str()?.to_string(),
                    has_child: item.get("has_child").and_then(|v| v.as_bool()).unwrap_or(false),
                })
            }));

            let has_more = data
                .get("has_more")
                .and_then(|value| value.as_bool())
                .unwrap_or(false);
            if !has_more {
                break;
            }

            page_token = data
                .get("page_token")
                .and_then(|value| value.as_str())
                .map(|value| value.to_string());

            if page_token.is_none() {
                break;
            }
        }

        Ok(nodes)
    }

    pub fn fetch_document(&self, document_id: &str) -> Result<RawDocument, McpError> {
        let token = self.access_token()?;
        let summary = self.fetch_document_summary(document_id)?;

        let raw_value = call_openapi_json(
            ureq::get(&self.endpoint(&format!("/docx/v1/documents/{document_id}/raw_content")))
                .set("Authorization", &format!("Bearer {token}")),
            "获取文档原始内容",
        )?;

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
            title: summary.title,
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

    #[test]
    fn parses_oauth_token_shape() {
        let parsed = parse_token_info(
            json!({
                "access_token": "access",
                "token_type": "Bearer",
                "expires_in": 7200,
                "refresh_expires_in": 2592000,
                "refresh_token": "refresh",
                "scope": "offline_access"
            }),
            "oauth",
        )
        .expect("token shape should parse");

        assert_eq!(parsed.access_token, "access");
        assert_eq!(parsed.refresh_token, "refresh");
    }

    #[test]
    fn openapi_error_keeps_scope_details() {
        let error = extract_openapi_error(
            &json!({
                "code": 99991672,
                "msg": "Access denied. One of the following scopes is required: [docx:document, docx:document:readonly]."
            }),
            "获取文档信息",
        )
        .expect("error should exist");

        assert!(error.to_string().contains("docx:document"));
        assert!(error.to_string().contains("Access denied"));
    }
}
