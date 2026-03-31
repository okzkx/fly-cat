use crate::model::{RichSegment, RichText};
use serde_json::{json, Value};
use std::{collections::HashSet, fmt, io::Read, path::Path, thread, time::Duration};

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
    Heading { level: u8, text: RichText },
    Paragraph { text: RichText },
    Image { media_id: String, alt: String },
    OrderedList { items: Vec<RichText> },
    BulletList { items: Vec<RichText> },
    CodeBlock { language: String, code: String },
    Quote { text: RichText },
    Table { rows: Vec<Vec<RichText>> },
    Divider,
    Todo { items: Vec<(bool, RichText)> },
}

#[derive(Clone, Debug)]
pub enum ImageResource {
    RemoteUrl(String),
    Binary { bytes: Vec<u8>, extension: String },
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

#[derive(Clone, Debug)]
pub struct ExportTaskResponse {
    pub ticket: String,
}

#[derive(Clone, Debug)]
pub struct ExportTaskResult {
    pub file_token: String,
}

const FEISHU_TOKEN_ENDPOINT: &str = "https://passport.feishu.cn/suite/passport/oauth/token";

fn extract_openapi_error(value: &Value, context: &str) -> Option<McpError> {
    let code = value
        .get("code")
        .and_then(|value| value.as_i64())
        .unwrap_or(0);
    if code == 0 {
        return None;
    }
    let msg = value
        .get("msg")
        .and_then(|value| value.as_str())
        .unwrap_or("unknown error");
    Some(McpError::Transport(format!(
        "{context}失败(code={code}): {msg}"
    )))
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
        Err(ureq::Error::Status(_, response)) => {
            return Err(status_error_from_response(response, context))
        }
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
        return Some(McpError::Transport(format!(
            "{context}失败: {error}: {description}"
        )));
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
    #[allow(dead_code)] // retained from OAuth response; may be needed for future API calls
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
    pub version: String,
    pub update_time: String,
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
        expires_in: value
            .get("expires_in")
            .and_then(|value| value.as_i64())
            .unwrap_or(0),
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

    let value: Value = response.into_json().map_err(|err| {
        McpError::InvalidResponse(format!("Invalid OAuth refresh response: {err}"))
    })?;

    parse_token_info(value, "刷新用户 access_token")
}

pub fn fetch_user_info(
    endpoint: &str,
    access_token: &str,
) -> Result<FeishuAuthorizedUser, McpError> {
    let endpoint = format!(
        "{}/{}",
        endpoint.trim_end_matches('/'),
        "authen/v1/user_info"
    );
    let value = call_openapi_json(
        ureq::get(&endpoint).set("Authorization", &format!("Bearer {access_token}")),
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
            "img-eng-api" => Ok(ImageResource::Binary {
                bytes: b"fixture-image-bytes".to_vec(),
                extension: ".png".into(),
            }),
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

/// Parse a Feishu block JSON into a RawBlock enum
/// Block types: 1=text, 2=heading, 3=bullet list, 4=ordered list, 14=code,
///              17=todo, 22=table/divider, 24=quote, 27|28=image
fn parse_block_from_json(block: &Value) -> Option<RawBlock> {
    let block_type = block
        .get("block_type")
        .and_then(|v| v.as_i64())
        .unwrap_or(0);

    match block_type {
        // Text block (type 1)
        1 => {
            let text = extract_text_from_block(block);
            if text.is_empty() {
                None
            } else {
                Some(RawBlock::Paragraph { text })
            }
        }
        // Heading block (type 2)
        2 => {
            let heading = block.get("heading");
            let level = heading
                .and_then(|h| h.get("style"))
                .and_then(|s| s.as_str())
                .and_then(|s| match s {
                    "heading1" => Some(1),
                    "heading2" => Some(2),
                    "heading3" => Some(3),
                    "heading4" => Some(4),
                    "heading5" => Some(5),
                    "heading6" => Some(6),
                    _ => Some(1),
                })
                .unwrap_or(1);

            let text = heading
                .and_then(|h| h.get("elements"))
                .and_then(|e| e.as_array())
                .map(|elements| extract_text_from_elements(elements))
                .unwrap_or_default();

            if text.is_empty() {
                None
            } else {
                Some(RawBlock::Heading { level, text })
            }
        }
        // T3: Bullet list (type 3)
        3 => {
            let text = extract_text_from_block(block);
            if text.is_empty() {
                None
            } else {
                Some(RawBlock::BulletList { items: vec![text] })
            }
        }
        // T2: Ordered list (type 4)
        4 => {
            let text = extract_text_from_block(block);
            if text.is_empty() {
                None
            } else {
                Some(RawBlock::OrderedList { items: vec![text] })
            }
        }
        // T4: Code block (type 14) — code content uses plain text (no inline styles)
        14 => {
            let code_block = block.get("code");
            let language = code_block
                .and_then(|cb| cb.get("language"))
                .and_then(|l| l.as_str())
                .unwrap_or("")
                .to_string();
            let code = code_block
                .and_then(|cb| cb.get("elements"))
                .and_then(|e| e.as_array())
                .map(|elements| extract_text_from_elements(elements).to_plain_text())
                .unwrap_or_default();
            if code.is_empty() {
                None
            } else {
                Some(RawBlock::CodeBlock { language, code })
            }
        }
        // T8: Todo / task block (type 17)
        17 => {
            let todo_block = block.get("todo");
            let elements = todo_block
                .and_then(|tb| tb.get("elements"))
                .and_then(|e| e.as_array());
            let text = elements
                .map(|elems| extract_text_from_elements(elems))
                .unwrap_or_default();
            if text.is_empty() {
                None
            } else {
                let done = todo_block
                    .and_then(|tb| tb.get("style"))
                    .and_then(|s| s.as_i64())
                    .map(|v| v == 1)
                    .unwrap_or(false);
                Some(RawBlock::Todo {
                    items: vec![(done, text)],
                })
            }
        }
        // T6/T7: Table (type 22) — check for divider subtype, otherwise table
        22 => {
            // Check if this is a divider (has "divider" key)
            if block.get("divider").is_some() {
                Some(RawBlock::Divider)
            } else {
                // Table block
                let table_block = block.get("table");
                let rows = table_block
                    .and_then(|tb| tb.get("cells"))
                    .and_then(|c| c.as_array())
                    .map(|cell_rows| {
                        cell_rows
                            .iter()
                            .filter_map(|row| {
                                row.as_array().map(|cells| {
                                    cells
                                        .iter()
                                        .map(|cell| {
                                            // Each cell may be an array of elements
                                            cell.as_array()
                                                .map(|elements| extract_text_from_elements(elements))
                                                .unwrap_or_default()
                                        })
                                        .collect::<Vec<_>>()
                                })
                            })
                            .collect::<Vec<_>>()
                    })
                    .unwrap_or_default();
                if rows.is_empty() {
                    None
                } else {
                    Some(RawBlock::Table { rows })
                }
            }
        }
        // T5: Quote block (type 24, quote_container)
        24 => {
            let text = extract_text_from_block(block);
            if text.is_empty() {
                None
            } else {
                Some(RawBlock::Quote { text })
            }
        }
        // Image block (type 27; keep 28 for compatibility with older assumptions)
        27 | 28 => {
            let image = block.get("image");
            let media_id = image
                .and_then(|i| i.get("token"))
                .and_then(|t| t.as_str())
                .map(|s| s.to_string());

            match media_id {
                Some(mid) => Some(RawBlock::Image {
                    media_id: mid,
                    alt: String::new(),
                }),
                None => Some(RawBlock::Paragraph {
                    text: "[图片]".into(),
                }),
            }
        }
        // Unknown block types - fallback to paragraph with placeholder
        _ => {
            let text = extract_text_from_block(block);
            if text.is_empty() {
                None
            } else {
                Some(RawBlock::Paragraph { text })
            }
        }
    }
}

/// Extract text content from a block's text elements
fn extract_text_from_block(block: &Value) -> RichText {
    // Try different block types to find text elements
    let elements = block
        .get("text")
        .and_then(|t| t.get("elements"))
        .or_else(|| block.get("heading").and_then(|h| h.get("elements")))
        .or_else(|| block.get("bullet").and_then(|b| b.get("elements")))
        .or_else(|| block.get("ordered").and_then(|o| o.get("elements")))
        .or_else(|| block.get("todo").and_then(|tb| tb.get("elements")))
        .or_else(|| block.get("quote").and_then(|q| q.get("elements")))
        .or_else(|| block.get("quote1").and_then(|q| q.get("elements")))
        .and_then(|e| e.as_array());

    match elements {
        Some(elems) => extract_text_from_elements(elems),
        None => RichText::default(),
    }
}

/// Extract rich text from an array of text elements, preserving inline styles.
fn extract_text_from_elements(elements: &[Value]) -> RichText {
    let segments: Vec<RichSegment> = elements
        .iter()
        .filter_map(|elem| {
            let text_run = elem.get("text_run")?;
            let content = text_run.get("content")?.as_str()?.to_string();

            let style = text_run.get("text_element_style");
            let bold = style
                .and_then(|s| s.get("bold"))
                .and_then(|b| b.as_bool())
                .unwrap_or(false);
            let italic = style
                .and_then(|s| s.get("italic"))
                .and_then(|i| i.as_bool())
                .unwrap_or(false);
            let strikethrough = style
                .and_then(|s| s.get("strikethrough"))
                .and_then(|st| st.as_bool())
                .unwrap_or(false);
            let link = style
                .and_then(|s| s.get("link"))
                .and_then(|l| l.get("url"))
                .and_then(|u| u.as_str())
                .map(|u| u.to_string());

            Some(RichSegment {
                content,
                bold,
                italic,
                strikethrough,
                link,
            })
        })
        .collect();

    RichText { segments }
}

fn extract_block_children_ids(block: &Value) -> Vec<String> {
    block
        .get("children")
        .and_then(|children| children.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|id| id.as_str().map(|s| s.to_string()))
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}

fn flatten_block_tree<F>(
    child_ids: &[String],
    fetch_block: &mut F,
    visited: &mut HashSet<String>,
    blocks: &mut Vec<RawBlock>,
) -> Result<(), McpError>
where
    F: FnMut(&str) -> Result<Value, McpError>,
{
    for child_id in child_ids {
        if !visited.insert(child_id.clone()) {
            continue;
        }
        let block = fetch_block(child_id)?;
        if let Some(parsed) = parse_block_from_json(&block) {
            blocks.push(parsed);
        }
        let nested_children = extract_block_children_ids(&block);
        if !nested_children.is_empty() {
            flatten_block_tree(&nested_children, fetch_block, visited, blocks)?;
        }
    }

    Ok(())
}

fn extension_from_content_type(content_type: &str) -> Option<String> {
    let mime = content_type.split(';').next()?.trim().to_ascii_lowercase();
    let ext = match mime.as_str() {
        "image/png" => ".png",
        "image/jpeg" => ".jpg",
        "image/jpg" => ".jpg",
        "image/gif" => ".gif",
        "image/webp" => ".webp",
        "image/bmp" => ".bmp",
        "image/svg+xml" => ".svg",
        _ => return None,
    };
    Some(ext.to_string())
}

fn extension_from_content_disposition(content_disposition: &str) -> Option<String> {
    let filename = content_disposition
        .split(';')
        .map(|part| part.trim())
        .find_map(|part| {
            part.strip_prefix("filename*=")
                .map(|value| value.rsplit('\'').next().unwrap_or(value))
                .or_else(|| {
                    part.strip_prefix("filename=")
                        .map(|value| value.trim_matches('"'))
                })
        })?;
    let clean_filename = filename.split('?').next().unwrap_or(filename);
    let extension = Path::new(clean_filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .filter(|ext| !ext.trim().is_empty())?;
    Some(format!(".{}", extension.to_ascii_lowercase()))
}

fn infer_media_extension(content_type: Option<&str>, content_disposition: Option<&str>) -> String {
    content_disposition
        .and_then(extension_from_content_disposition)
        .or_else(|| content_type.and_then(extension_from_content_type))
        .unwrap_or_else(|| ".png".to_string())
}

pub struct FeishuOpenApiClient {
    config: FeishuOpenApiConfig,
    agent: ureq::Agent,
}

impl FeishuOpenApiClient {
    pub fn new(config: FeishuOpenApiConfig) -> Self {
        Self {
            config,
            agent: ureq::Agent::new(),
        }
    }

    fn endpoint(&self, path: &str) -> String {
        format!(
            "{}/{}",
            self.config.endpoint.trim_end_matches('/'),
            path.trim_start_matches('/')
        )
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
            let mut request = self
                .agent
                .get(&self.endpoint("/wiki/v2/spaces"))
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

    pub fn fetch_document_summary(
        &self,
        document_id: &str,
    ) -> Result<FeishuDocumentSummary, McpError> {
        let token = self.access_token()?;
        let info_value = call_openapi_json(
            self.agent
                .get(&self.endpoint(&format!("/docx/v1/documents/{document_id}")))
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

        let title =
            value_to_string(document.get("title")).unwrap_or_else(|| document_id.to_string());
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

    pub fn list_child_nodes(
        &self,
        space_id: &str,
        parent_node_token: Option<&str>,
    ) -> Result<Vec<FeishuWikiNode>, McpError> {
        let token = self.access_token()?;
        let mut page_token: Option<String> = None;
        let mut nodes = Vec::new();

        loop {
            let mut request = self
                .agent
                .get(&self.endpoint(&format!("/wiki/v2/spaces/{space_id}/nodes")))
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

            if let Some(error) = extract_openapi_error(&value, "获取知识空间子节点列表")
            {
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
                let title = item.get("title")?.as_str()?.to_string();
                let version = value_to_string(item.get("revision_id"))
                    .or_else(|| value_to_string(item.get("revision")))
                    .or_else(|| value_to_string(item.get("version")))
                    .or_else(|| value_to_string(item.get("obj_edit_time")))
                    .or_else(|| value_to_string(item.get("update_time")))
                    .unwrap_or_else(|| title.clone());
                let update_time = value_to_string(item.get("obj_edit_time"))
                    .or_else(|| value_to_string(item.get("update_time")))
                    .or_else(|| value_to_string(item.get("updated_at")))
                    .or_else(|| value_to_string(item.get("edit_time")))
                    .unwrap_or_else(|| version.clone());
                Some(FeishuWikiNode {
                    space_id: item.get("space_id")?.as_str()?.to_string(),
                    node_token: item.get("node_token")?.as_str()?.to_string(),
                    obj_token: item.get("obj_token")?.as_str()?.to_string(),
                    obj_type: item.get("obj_type")?.as_str()?.to_string(),
                    title,
                    has_child: item
                        .get("has_child")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false),
                    version,
                    update_time,
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

        // Use Block API instead of raw_content API to get structured content including images
        let blocks = self.fetch_document_blocks(document_id, token)?;

        Ok(RawDocument {
            document_id: document_id.to_string(),
            space_id: "wiki-openapi".into(),
            title: summary.title,
            blocks,
        })
    }

    /// Fetch document blocks using Feishu Block API
    /// Returns structured blocks including images with media_id
    fn fetch_document_blocks(
        &self,
        document_id: &str,
        token: &str,
    ) -> Result<Vec<RawBlock>, McpError> {
        // Get the root block (document itself) which contains children
        let root_value = call_openapi_json(
            self.agent
                .get(&self.endpoint(&format!(
                    "/docx/v1/documents/{document_id}/blocks/{document_id}"
                )))
                .set("Authorization", &format!("Bearer {token}"))
                .query("page_size", "500"),
            "获取文档块",
        )?;

        if let Some(error) = extract_openapi_error(&root_value, "获取文档块") {
            return Err(error);
        }

        let block = root_value
            .get("data")
            .and_then(|data| data.get("block"))
            .ok_or_else(|| McpError::InvalidResponse("Block response missing block".into()))?;

        let children_ids = extract_block_children_ids(block);

        if children_ids.is_empty() {
            return Ok(vec![]);
        }

        let mut blocks = Vec::new();
        let mut visited = HashSet::new();
        let mut fetch_block =
            |block_id: &str| self.fetch_single_block_json(document_id, block_id, token);
        flatten_block_tree(&children_ids, &mut fetch_block, &mut visited, &mut blocks)?;

        Ok(blocks)
    }

    /// Fetch a single block by its ID and return the raw block JSON.
    fn fetch_single_block_json(
        &self,
        document_id: &str,
        block_id: &str,
        token: &str,
    ) -> Result<Value, McpError> {
        let value = call_openapi_json(
            self.agent
                .get(&self.endpoint(&format!(
                    "/docx/v1/documents/{document_id}/blocks/{block_id}"
                )))
                .set("Authorization", &format!("Bearer {token}")),
            "获取子块",
        )?;

        if let Some(error) = extract_openapi_error(&value, "获取子块") {
            return Err(error);
        }

        value
            .get("data")
            .and_then(|data| data.get("block"))
            .cloned()
            .ok_or_else(|| McpError::InvalidResponse("Child block response missing block".into()))
    }

    /// Create an export task for a document (server-side rendering).
    pub fn create_export_task(
        &self,
        token: &str,
        file_extension: &str,
        file_type: &str,
    ) -> Result<ExportTaskResponse, McpError> {
        let access = self.access_token()?;
        let response = match self
            .agent
            .post(&self.endpoint("/drive/v1/export_tasks"))
            .set("Authorization", &format!("Bearer {access}"))
            .send_json(json!({
                "token": token,
                "file_extension": file_extension,
                "type": file_type,
            })) {
            Ok(response) => response,
            Err(ureq::Error::Status(_, response)) => {
                return Err(status_error_from_response(response, "创建导出任务"))
            }
            Err(err) => return Err(McpError::Transport(format!("创建导出任务请求失败: {err}"))),
        };

        let value: Value = response
            .into_json()
            .map_err(|err| McpError::InvalidResponse(format!("导出任务响应解析失败: {err}")))?;

        let ticket = value
            .get("ticket")
            .and_then(|v| v.as_str())
            .ok_or_else(|| McpError::InvalidResponse("export_tasks missing ticket".into()))?
            .to_string();

        Ok(ExportTaskResponse { ticket })
    }

    /// Poll export task status. Returns ExportTaskResult when job_status == 0 (success).
    pub fn get_export_task_status(
        &self,
        ticket: &str,
        token: &str,
    ) -> Result<Option<ExportTaskResult>, McpError> {
        let access = self.access_token()?;
        let value = call_openapi_json(
            self.agent
                .get(&self.endpoint(&format!("/drive/v1/export_tasks/{ticket}")))
                .query("token", token)
                .set("Authorization", &format!("Bearer {access}")),
            "查询导出任务状态",
        )?;

        let result = value
            .get("result")
            .ok_or_else(|| McpError::InvalidResponse("export task status missing result".into()))?;
        let job_status = result
            .get("job_status")
            .and_then(|v| v.as_i64())
            .unwrap_or(-1);

        match job_status {
            0 => {
                // Success
                let file_token = result
                    .get("file_token")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| {
                        McpError::InvalidResponse("export result missing file_token".into())
                    })?
                    .to_string();
                Ok(Some(ExportTaskResult { file_token }))
            }
            1 | 2 => Ok(None), // Initializing or processing
            _ => {
                let msg = result
                    .get("job_error_msg")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown export error");
                Err(McpError::Transport(format!(
                    "导出任务失败(status={job_status}): {msg}"
                )))
            }
        }
    }

    /// Download the exported file binary content.
    pub fn download_export_file(&self, file_token: &str) -> Result<Vec<u8>, McpError> {
        let access = self.access_token()?;
        let url = self.endpoint(&format!(
            "/drive/v1/export_tasks/file/{file_token}/download"
        ));
        let response = match self
            .agent
            .get(&url)
            .set("Authorization", &format!("Bearer {access}"))
            .call()
        {
            Ok(response) => response,
            Err(ureq::Error::Status(_, response)) => {
                return Err(status_error_from_response(response, "下载导出文件"));
            }
            Err(err) => return Err(McpError::Transport(format!("下载导出文件请求失败: {err}"))),
        };

        let mut buf = Vec::new();
        response
            .into_reader()
            .read_to_end(&mut buf)
            .map_err(|err| McpError::Transport(format!("读取导出文件内容失败: {err}")))?;
        Ok(buf)
    }

    pub fn download_media_file(&self, media_id: &str) -> Result<(Vec<u8>, String), McpError> {
        let access = self.access_token()?;
        let url = self.endpoint(&format!("/drive/v1/medias/{media_id}/download"));
        let response = match self
            .agent
            .get(&url)
            .set("Authorization", &format!("Bearer {access}"))
            .call()
        {
            Ok(response) => response,
            Err(ureq::Error::Status(_, response)) => {
                return Err(status_error_from_response(response, "下载图片资源"));
            }
            Err(err) => return Err(McpError::Transport(format!("下载图片资源请求失败: {err}"))),
        };

        let extension = infer_media_extension(
            response.header("Content-Type"),
            response.header("Content-Disposition"),
        );
        let mut buf = Vec::new();
        response
            .into_reader()
            .read_to_end(&mut buf)
            .map_err(|err| McpError::Transport(format!("读取图片资源内容失败: {err}")))?;
        Ok((buf, extension))
    }
}

impl ImageProvider for FeishuOpenApiClient {
    fn fetch_image_resource(&self, media_id: &str) -> Result<ImageResource, McpError> {
        let (bytes, extension) = self.download_media_file(media_id)?;
        Ok(ImageResource::Binary { bytes, extension })
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
    use std::collections::HashMap;

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

    #[test]
    fn flattens_nested_child_blocks_in_depth_first_order() {
        let blocks_by_id = HashMap::from([
            (
                "heading-1".to_string(),
                json!({
                    "block_type": 2,
                    "heading": {
                        "style": "heading2",
                        "elements": [{ "text_run": { "content": "章节" } }]
                    },
                    "children": ["image-1"]
                }),
            ),
            (
                "image-1".to_string(),
                json!({
                    "block_type": 28,
                    "image": { "token": "img-nested" }
                }),
            ),
            (
                "paragraph-1".to_string(),
                json!({
                    "block_type": 1,
                    "text": {
                        "elements": [{ "text_run": { "content": "尾段" } }]
                    }
                }),
            ),
        ]);

        let mut fetch_block = |block_id: &str| {
            blocks_by_id
                .get(block_id)
                .cloned()
                .ok_or_else(|| McpError::InvalidResponse(format!("missing block `{block_id}`")))
        };
        let mut visited = HashSet::new();
        let mut blocks = Vec::new();

        flatten_block_tree(
            &["heading-1".to_string(), "paragraph-1".to_string()],
            &mut fetch_block,
            &mut visited,
            &mut blocks,
        )
        .expect("flatten should succeed");

        assert!(matches!(blocks[0], RawBlock::Heading { .. }));
        assert!(matches!(blocks[1], RawBlock::Image { .. }));
        assert!(matches!(blocks[2], RawBlock::Paragraph { .. }));
    }

    #[test]
    fn infers_extension_from_media_headers() {
        let extension = infer_media_extension(
            Some("image/jpeg"),
            Some("attachment; filename=\"concept-art.jpeg\""),
        );

        assert_eq!(extension, ".jpeg");
    }

    // --- New block type parsing tests ---

    #[test]
    fn parses_bullet_list_block() {
        let block = json!({
            "block_type": 3,
            "bullet": {
                "elements": [{ "text_run": { "content": "列表项" } }]
            }
        });
        let parsed = parse_block_from_json(&block).expect("bullet list should parse");
        assert!(
            matches!(parsed, RawBlock::BulletList { ref items } if items == &vec![RichText::plain("列表项")])
        );
    }

    #[test]
    fn parses_ordered_list_block() {
        let block = json!({
            "block_type": 4,
            "ordered": {
                "elements": [{ "text_run": { "content": "有序项" } }]
            }
        });
        let parsed = parse_block_from_json(&block).expect("ordered list should parse");
        assert!(
            matches!(parsed, RawBlock::OrderedList { ref items } if items == &vec![RichText::plain("有序项")])
        );
    }

    #[test]
    fn parses_code_block() {
        let block = json!({
            "block_type": 14,
            "code": {
                "language": "python",
                "elements": [{ "text_run": { "content": "print('hello')" } }]
            }
        });
        let parsed = parse_block_from_json(&block).expect("code block should parse");
        assert!(
            matches!(parsed, RawBlock::CodeBlock { ref language, ref code }
                if language == "python" && code == "print('hello')")
        );
    }

    #[test]
    fn parses_code_block_without_language() {
        let block = json!({
            "block_type": 14,
            "code": {
                "elements": [{ "text_run": { "content": "some code" } }]
            }
        });
        let parsed = parse_block_from_json(&block).expect("code block without language should parse");
        assert!(
            matches!(parsed, RawBlock::CodeBlock { ref language, ref code }
                if language.is_empty() && code == "some code")
        );
    }

    #[test]
    fn parses_quote_block() {
        let block = json!({
            "block_type": 24,
            "quote": {
                "elements": [{ "text_run": { "content": "引用内容" } }]
            }
        });
        let parsed = parse_block_from_json(&block).expect("quote block should parse");
        assert!(
            matches!(parsed, RawBlock::Quote { ref text } if text == &RichText::plain("引用内容"))
        );
    }

    #[test]
    fn parses_table_block() {
        let block = json!({
            "block_type": 22,
            "table": {
                "cells": [
                    [
                        [{ "text_run": { "content": "Header 1" } }],
                        [{ "text_run": { "content": "Header 2" } }]
                    ],
                    [
                        [{ "text_run": { "content": "Cell 1" } }],
                        [{ "text_run": { "content": "Cell 2" } }]
                    ]
                ]
            }
        });
        let parsed = parse_block_from_json(&block).expect("table block should parse");
        assert!(matches!(parsed, RawBlock::Table { ref rows } if rows.len() == 2));
        if let RawBlock::Table { rows } = parsed {
            assert_eq!(rows[0], vec![RichText::plain("Header 1"), RichText::plain("Header 2")]);
            assert_eq!(rows[1], vec![RichText::plain("Cell 1"), RichText::plain("Cell 2")]);
        }
    }

    #[test]
    fn parses_divider_block() {
        let block = json!({
            "block_type": 22,
            "divider": {}
        });
        let parsed = parse_block_from_json(&block).expect("divider should parse");
        assert!(matches!(parsed, RawBlock::Divider));
    }

    #[test]
    fn parses_todo_block_unchecked() {
        let block = json!({
            "block_type": 17,
            "todo": {
                "style": 0,
                "elements": [{ "text_run": { "content": "待办事项" } }]
            }
        });
        let parsed = parse_block_from_json(&block).expect("todo block should parse");
        assert!(
            matches!(parsed, RawBlock::Todo { ref items } if items == &vec![(false, RichText::plain("待办事项"))])
        );
    }

    #[test]
    fn parses_todo_block_checked() {
        let block = json!({
            "block_type": 17,
            "todo": {
                "style": 1,
                "elements": [{ "text_run": { "content": "已完成事项" } }]
            }
        });
        let parsed = parse_block_from_json(&block).expect("checked todo block should parse");
        assert!(
            matches!(parsed, RawBlock::Todo { ref items } if items == &vec![(true, RichText::plain("已完成事项"))])
        );
    }

    #[test]
    fn parses_image_block_type_27() {
        let block = json!({
            "block_type": 27,
            "image": { "token": "img-type-27" }
        });
        let parsed = parse_block_from_json(&block).expect("image type 27 should parse");
        assert!(matches!(
            parsed,
            RawBlock::Image { ref media_id, .. } if media_id == "img-type-27"
        ));
    }

    // --- Rich text inline style parsing tests ---

    #[test]
    fn extracts_plain_text_without_style() {
        let elements = vec![json!({ "text_run": { "content": "hello" } })];
        let rich = extract_text_from_elements(&elements);
        assert_eq!(rich.segments.len(), 1);
        assert_eq!(rich.segments[0].content, "hello");
        assert!(!rich.segments[0].bold);
        assert!(!rich.segments[0].italic);
        assert!(!rich.segments[0].strikethrough);
        assert!(rich.segments[0].link.is_none());
    }

    #[test]
    fn extracts_bold_text() {
        let elements = vec![json!({
            "text_run": {
                "content": "bold text",
                "text_element_style": { "bold": true }
            }
        })];
        let rich = extract_text_from_elements(&elements);
        assert_eq!(rich.segments.len(), 1);
        assert!(rich.segments[0].bold);
        assert!(!rich.segments[0].italic);
    }

    #[test]
    fn extracts_italic_text() {
        let elements = vec![json!({
            "text_run": {
                "content": "italic text",
                "text_element_style": { "italic": true }
            }
        })];
        let rich = extract_text_from_elements(&elements);
        assert!(rich.segments[0].italic);
    }

    #[test]
    fn extracts_strikethrough_text() {
        let elements = vec![json!({
            "text_run": {
                "content": "deleted",
                "text_element_style": { "strikethrough": true }
            }
        })];
        let rich = extract_text_from_elements(&elements);
        assert!(rich.segments[0].strikethrough);
    }

    #[test]
    fn extracts_link_with_url() {
        let elements = vec![json!({
            "text_run": {
                "content": "click here",
                "text_element_style": {
                    "link": { "url": "https://example.com" }
                }
            }
        })];
        let rich = extract_text_from_elements(&elements);
        assert_eq!(rich.segments[0].link.as_deref(), Some("https://example.com"));
    }

    #[test]
    fn extracts_combined_styles() {
        let elements = vec![json!({
            "text_run": {
                "content": "bold italic link",
                "text_element_style": {
                    "bold": true,
                    "italic": true,
                    "link": { "url": "https://example.com" }
                }
            }
        })];
        let rich = extract_text_from_elements(&elements);
        assert!(rich.segments[0].bold);
        assert!(rich.segments[0].italic);
        assert_eq!(rich.segments[0].link.as_deref(), Some("https://example.com"));
    }

    #[test]
    fn extracts_multiple_segments() {
        let elements = vec![
            json!({ "text_run": { "content": "normal " } }),
            json!({ "text_run": { "content": "bold", "text_element_style": { "bold": true } } }),
            json!({ "text_run": { "content": " end" } }),
        ];
        let rich = extract_text_from_elements(&elements);
        assert_eq!(rich.segments.len(), 3);
        assert!(!rich.segments[0].bold);
        assert!(rich.segments[1].bold);
        assert!(!rich.segments[2].bold);
        assert_eq!(rich.to_plain_text(), "normal bold end");
    }
}
