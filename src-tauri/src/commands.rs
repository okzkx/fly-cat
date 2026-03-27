use crate::mcp::{
    exchange_user_access_token, fetch_user_info, refresh_user_access_token,
    FeishuOpenApiClient, FeishuOpenApiConfig, FeishuOAuthTokenInfo, FeishuWikiNode, McpError,
};
use crate::sync::{sync_document_to_disk, SyncPipelineError};
use chrono::{Local, TimeZone, Utc};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Component, Path, PathBuf},
    sync::Mutex,
};
use tauri::{AppHandle, Emitter, Manager, State};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncCounters {
    pub total: u32,
    pub processed: u32,
    pub succeeded: u32,
    pub skipped: u32,
    pub failed: u32,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncRunError {
    pub document_id: String,
    pub title: String,
    pub category: String,
    pub message: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncFailureSummary {
    pub category: String,
    pub message: String,
    pub count: u32,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncTask {
    pub id: String,
    pub name: String,
    pub selected_spaces: Vec<String>,
    pub output_path: String,
    pub status: String,
    pub progress: u32,
    pub counters: SyncCounters,
    pub lifecycle_state: String,
    pub errors: Vec<SyncRunError>,
    pub failure_summary: Option<SyncFailureSummary>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub name: String,
    pub avatar: Option<String>,
    pub email: Option<String>,
    pub user_id: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredUserSession {
    pub access_token: String,
    pub refresh_token: String,
    pub access_token_expires_at: i64,
    pub refresh_token_expires_at: i64,
    pub scope: Option<String>,
    pub user: UserInfo,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub app_id: String,
    pub app_secret: String,
    pub endpoint: String,
    pub sync_root: String,
    pub mcp_server_name: String,
    pub image_dir_name: String,
    pub wiki_space_ids: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeBaseSpace {
    pub id: String,
    pub name: String,
    pub selected: bool,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionValidation {
    pub status: String,
    pub usable: bool,
    pub message: String,
    pub diagnostics: Option<String>,
    pub spaces_loaded: bool,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionCheckResult {
    pub user: Option<UserInfo>,
    pub spaces: Vec<KnowledgeBaseSpace>,
    pub validation: ConnectionValidation,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppBootstrap {
    pub settings: Option<AppSettings>,
    pub resolved_sync_root: Option<String>,
    pub user: Option<UserInfo>,
    pub spaces: Vec<KnowledgeBaseSpace>,
    pub connection_validation: Option<ConnectionValidation>,
}

#[derive(Clone)]
struct KnowledgeBaseDocument {
    id: String,
    space_id: String,
    title: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSyncTaskRequest {
    pub selected_spaces: Vec<String>,
    pub output_path: String,
}

#[derive(Default)]
pub struct AppState {
    pub tasks: Mutex<Vec<SyncTask>>,
    pub running_task_ids: Mutex<HashSet<String>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    pub runtime: &'static str,
    pub version: &'static str,
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

fn format_iso_for_task_name(value: &str) -> String {
    chrono::DateTime::parse_from_rfc3339(value)
        .map(|datetime| datetime.with_timezone(&Local).format("%Y-%m-%d %H:%M:%S").to_string())
        .unwrap_or_else(|_| value.to_string())
}

fn build_task_name(created_at: &str) -> String {
    format!("同步任务 - {}", format_iso_for_task_name(created_at))
}

fn now_epoch_seconds() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0)
}

fn parse_legacy_system_time_debug(value: &str) -> Option<String> {
    let intervals = value
        .strip_prefix("SystemTime { intervals: ")?
        .strip_suffix(" }")?
        .trim()
        .parse::<i128>()
        .ok()?;
    let unix_intervals = intervals.checked_sub(116_444_736_000_000_000)?;
    let seconds = (unix_intervals / 10_000_000) as i64;
    let nanos = ((unix_intervals % 10_000_000) * 100) as u32;
    Utc.timestamp_opt(seconds, nanos)
        .single()
        .map(|datetime| datetime.to_rfc3339())
}

fn normalize_timestamp_string(value: &str) -> String {
    if let Ok(datetime) = chrono::DateTime::parse_from_rfc3339(value) {
        return datetime.with_timezone(&Utc).to_rfc3339();
    }

    parse_legacy_system_time_debug(value).unwrap_or_else(now_iso)
}

fn normalize_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            Component::Prefix(prefix) => normalized.push(prefix.as_os_str()),
            Component::RootDir => normalized.push(component.as_os_str()),
            Component::Normal(part) => normalized.push(part),
        }
    }
    normalized
}

fn default_sync_root_base(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(path) = app.path().document_dir() {
        return Ok(path);
    }

    std::env::current_dir().map_err(|err| err.to_string())
}

fn resolve_sync_root_from_base(base: &Path, configured_path: &str) -> Result<PathBuf, String> {
    let configured = configured_path.trim();
    if configured.is_empty() {
        return Err("请输入同步目录".into());
    }

    let path = PathBuf::from(configured);
    let resolved = if path.is_absolute() {
        path
    } else {
        base.join(path)
    };

    Ok(normalize_path(&resolved))
}

fn resolve_sync_root_path(app: &AppHandle, configured_path: &str) -> Result<PathBuf, String> {
    resolve_sync_root_from_base(&default_sync_root_base(app)?, configured_path)
}

fn resolve_sync_root_string(app: &AppHandle, configured_path: &str) -> Result<String, String> {
    Ok(resolve_sync_root_path(app, configured_path)?
        .to_string_lossy()
        .replace('\\', "/"))
}

fn summarize_failure_category(category: &str) -> &'static str {
    match category {
        "auth" => "授权",
        "discovery" => "发现",
        "content-fetch" => "内容抓取",
        "markdown-render" => "Markdown 渲染",
        "image-resolution" => "图片处理",
        "filesystem-write" => "文件写入",
        _ => "未知",
    }
}

fn is_auth_message(message: &str) -> bool {
    let normalized = message.to_lowercase();
    [
        "authorization",
        "unauthorized",
        "access denied",
        "permission",
        "scope",
        "token",
        "登录",
        "授权",
        "权限",
    ]
    .iter()
    .any(|keyword| normalized.contains(keyword))
}

fn build_failure_summary(errors: &[SyncRunError]) -> Option<SyncFailureSummary> {
    if errors.is_empty() {
        return None;
    }

    let mut counts: HashMap<&str, u32> = HashMap::new();
    for error in errors {
        *counts.entry(error.category.as_str()).or_default() += 1;
    }

    let (dominant_category, count) = counts
        .into_iter()
        .max_by_key(|(_, count)| *count)
        .map(|(category, count)| (category.to_string(), count))?;
    let sample_error = errors
        .iter()
        .find(|error| error.category == dominant_category)
        .unwrap_or(&errors[0]);

    let message = if count == errors.len() as u32 {
        format!(
            "本次失败主要发生在{}阶段（{}项）。{}",
            summarize_failure_category(&dominant_category),
            count,
            sample_error.message
        )
    } else {
        format!(
            "本次共有 {} 项失败，主要集中在{}阶段（{}项）。{}",
            errors.len(),
            summarize_failure_category(&dominant_category),
            count,
            sample_error.message
        )
    };

    Some(SyncFailureSummary {
        category: dominant_category,
        message,
        count,
    })
}

fn settings_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    Ok(app_data_dir.join("app-settings.json"))
}

fn session_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    Ok(app_data_dir.join("auth-session.json"))
}

fn load_json_file<T>(path: PathBuf) -> Result<Option<T>, String>
where
    T: for<'de> Deserialize<'de>,
{
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(path).map_err(|err| err.to_string())?;
    let parsed = serde_json::from_str(&content).map_err(|err| err.to_string())?;
    Ok(Some(parsed))
}

fn save_json_file<T>(path: PathBuf, value: &T) -> Result<(), String>
where
    T: Serialize,
{
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let content = serde_json::to_string_pretty(value).map_err(|err| err.to_string())?;
    fs::write(path, content).map_err(|err| err.to_string())
}

fn load_user_session(app: &AppHandle) -> Result<Option<StoredUserSession>, String> {
    load_json_file(session_file_path(app)?)
}

fn save_user_session(app: &AppHandle, session: &StoredUserSession) -> Result<(), String> {
    save_json_file(session_file_path(app)?, session)
}

fn clear_user_session(app: &AppHandle) -> Result<(), String> {
    let session_path = session_file_path(app)?;
    if session_path.exists() {
        fs::remove_file(session_path).map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn tasks_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    Ok(app_data_dir.join("sync-tasks.json"))
}

fn load_tasks_from_disk(app: &AppHandle) -> Result<Vec<SyncTask>, String> {
    let file_path = tasks_file_path(app)?;
    if !file_path.exists() {
        return Ok(vec![]);
    }
    let content = fs::read_to_string(&file_path).map_err(|err| err.to_string())?;
    let mut tasks: Vec<SyncTask> = serde_json::from_str(&content).map_err(|err| err.to_string())?;
    for task in &mut tasks {
        task.created_at = normalize_timestamp_string(&task.created_at);
        task.updated_at = normalize_timestamp_string(&task.updated_at);
        if task.name.contains("SystemTime") {
            task.name = build_task_name(&task.created_at);
        }
        task.failure_summary = build_failure_summary(&task.errors);
        if !Path::new(&task.output_path).is_absolute() {
            task.output_path = resolve_sync_root_string(app, &task.output_path)?;
        }
        task.counters.failed = task.errors.len() as u32;
        task.counters.succeeded = task
            .counters
            .processed
            .saturating_sub(task.counters.skipped + task.counters.failed);
    }
    Ok(tasks)
}

fn save_tasks_to_disk(app: &AppHandle, tasks: &[SyncTask]) -> Result<(), String> {
    let file_path = tasks_file_path(app)?;
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let content = serde_json::to_string_pretty(tasks).map_err(|err| err.to_string())?;
    fs::write(file_path, content).map_err(|err| err.to_string())
}

fn with_tasks<T, F>(app: &AppHandle, state: State<'_, AppState>, updater: F) -> Result<T, String>
where
    F: FnOnce(&mut Vec<SyncTask>) -> Result<T, String>,
{
    let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
    if tasks.is_empty() {
        *tasks = load_tasks_from_disk(app)?;
    }
    let result = updater(&mut tasks)?;
    save_tasks_to_disk(app, &tasks)?;
    Ok(result)
}

fn emit_task_event(app: &AppHandle, event_name: &str, task: &SyncTask) {
    let _ = app.emit(event_name, task.clone());
}

fn knowledge_base_catalog() -> Vec<KnowledgeBaseDocument> {
    vec![
        KnowledgeBaseDocument {
            id: "doc-eng-architecture".into(),
            space_id: "kb-eng".into(),
            title: "研发架构设计".into(),
        },
        KnowledgeBaseDocument {
            id: "doc-eng-api".into(),
            space_id: "kb-eng".into(),
            title: "研发API概览".into(),
        },
        KnowledgeBaseDocument {
            id: "doc-product-overview".into(),
            space_id: "kb-product".into(),
            title: "Product Overview".into(),
        },
        KnowledgeBaseDocument {
            id: "doc-product-roadmap".into(),
            space_id: "kb-product".into(),
            title: "产品路线图".into(),
        },
        KnowledgeBaseDocument {
            id: "doc-ops-playbook".into(),
            space_id: "kb-ops".into(),
            title: "运维值班手册".into(),
        },
    ]
}

fn discover_documents(selected_spaces: &[String]) -> Vec<KnowledgeBaseDocument> {
    knowledge_base_catalog()
        .into_iter()
        .filter(|document| selected_spaces.iter().any(|space| space == &document.space_id))
        .collect()
}

fn app_settings_to_openapi_config(
    settings: &AppSettings,
    session: &StoredUserSession,
) -> Option<FeishuOpenApiConfig> {
    if settings.app_id.trim().is_empty()
        || settings.app_secret.trim().is_empty()
        || session.access_token.trim().is_empty()
    {
        return None;
    }

    Some(FeishuOpenApiConfig {
        endpoint: settings.endpoint.clone(),
        access_token: session.access_token.clone(),
    })
}

fn validate_settings_for_connection(settings: &AppSettings) -> Result<(), String> {
    if settings.app_id.trim().is_empty() {
        return Err("请先填写 App ID".into());
    }
    if settings.app_secret.trim().is_empty() {
        return Err("请先填写 App Secret".into());
    }
    if settings.endpoint.trim().is_empty() {
        return Err("请先填写 OpenAPI Endpoint".into());
    }
    Ok(())
}

fn build_authorize_url(settings: &AppSettings, redirect_uri: &str) -> Result<String, String> {
    validate_settings_for_connection(settings)?;
    let redirect_uri = urlencoding::encode(redirect_uri);
    let state = urlencoding::encode("desktop-login");
    let scope = urlencoding::encode(
        "docs:doc docs:document.media:download docs:document:export docx:document drive:drive drive:file drive:file:download offline_access",
    );

    Ok(format!(
        "https://passport.feishu.cn/suite/passport/oauth/authorize?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}",
        settings.app_id, redirect_uri, scope, state
    ))
}

fn token_expiring(expires_at: i64) -> bool {
    expires_at <= now_epoch_seconds() + 300
}

fn build_session_from_token(token: FeishuOAuthTokenInfo, user: UserInfo) -> StoredUserSession {
    let now = now_epoch_seconds();
    StoredUserSession {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        access_token_expires_at: now + token.expires_in.max(0),
        refresh_token_expires_at: now + token.refresh_expires_in.max(0),
        scope: (!token.scope.trim().is_empty()).then_some(token.scope),
        user,
    }
}

fn refresh_session(settings: &AppSettings, session: &StoredUserSession) -> Result<StoredUserSession, String> {
    if session.refresh_token_expires_at <= now_epoch_seconds() {
        return Err("当前登录会话已过期，请重新授权。".into());
    }

    let token = refresh_user_access_token(&settings.app_id, &settings.app_secret, &session.refresh_token)
        .map_err(|err| err.to_string())?;
    let user = fetch_user_info(&settings.endpoint, &token.access_token).map_err(|err| err.to_string())?;

    Ok(build_session_from_token(
        token,
        UserInfo {
            name: user.name,
            avatar: user.avatar,
            email: user.email,
            user_id: user.user_id,
        },
    ))
}

fn configured_space_ids(settings: &AppSettings) -> Option<Vec<String>> {
    settings
        .wiki_space_ids
        .as_ref()
        .map(|value| {
            value
                .split(',')
                .map(|item| item.trim().to_string())
                .filter(|item| !item.is_empty())
                .collect::<Vec<_>>()
        })
        .filter(|items| !items.is_empty())
}

fn build_validation(
    status: &str,
    usable: bool,
    message: impl Into<String>,
    diagnostics: Option<String>,
    spaces_loaded: bool,
) -> ConnectionValidation {
    ConnectionValidation {
        status: status.to_string(),
        usable,
        message: message.into(),
        diagnostics,
        spaces_loaded,
    }
}

fn build_connected_result(
    user: UserInfo,
    spaces: Vec<KnowledgeBaseSpace>,
    message: impl Into<String>,
    diagnostics: Option<String>,
) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: Some(user),
        spaces,
        validation: build_validation("connected-with-spaces", true, message, diagnostics, true),
    }
}

fn build_empty_connected_result(
    user: UserInfo,
    message: impl Into<String>,
    diagnostics: Option<String>,
) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: Some(user),
        spaces: vec![],
        validation: build_validation("connected-no-spaces", true, message, diagnostics, true),
    }
}

fn build_not_signed_in_result(message: impl Into<String>) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: None,
        spaces: vec![],
        validation: build_validation("not-signed-in", false, message, None, false),
    }
}

fn build_session_expired_result(message: impl Into<String>) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: None,
        spaces: vec![],
        validation: build_validation("session-expired", false, message, None, false),
    }
}

fn build_reauthorization_required_result(message: impl Into<String>, diagnostics: Option<String>) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: None,
        spaces: vec![],
        validation: build_validation("reauthorization-required", false, message, diagnostics, false),
    }
}

fn to_knowledge_base_spaces(spaces: Vec<(String, String)>) -> Vec<KnowledgeBaseSpace> {
    let first_space_id = spaces.first().map(|(space_id, _)| space_id.clone());
    spaces
        .into_iter()
        .map(|(id, name)| KnowledgeBaseSpace {
            selected: first_space_id
                .as_ref()
                .map(|space_id| space_id == &id)
                .unwrap_or(false),
            id,
            name,
        })
        .collect()
}

fn is_permission_error(message: &str) -> bool {
    let normalized = message.to_lowercase();
    [
        "permission",
        "forbidden",
        "scope",
        "unauthorized",
        "permission denied",
        "access denied",
        "无权限",
        "权限",
    ]
    .iter()
    .any(|keyword| normalized.contains(keyword))
}

fn classify_discovery_error(error: &McpError, context: &str) -> ConnectionValidation {
    let diagnostics = Some(format!("{context}: {error}"));
    if is_permission_error(&error.to_string()) {
        return build_validation(
            "permission-denied",
            false,
            "连接已建立，但缺少知识库读取权限。请确认应用具备 wiki 读取权限，并已被加入目标知识空间。",
            diagnostics,
            false,
        );
    }

    match error {
        McpError::Transport(_) => build_validation(
            "request-failed",
            false,
            "知识空间加载失败，请检查 Endpoint、网络连通性和飞书接口状态后重试。",
            diagnostics,
            false,
        ),
        McpError::InvalidResponse(_) => build_validation(
            "unexpected-response",
            false,
            "知识空间接口返回了当前应用无法识别的响应格式，请检查接口兼容性。",
            diagnostics,
            false,
        ),
    }
}

fn log_discovery(stage: &str, message: &str) {
    eprintln!("[knowledge-space-discovery] {stage}: {message}");
}

fn probe_configured_spaces(
    client: &FeishuOpenApiClient,
    space_ids: &[String],
) -> Result<Vec<KnowledgeBaseSpace>, McpError> {
    let mut accessible_space_ids = Vec::new();
    let mut last_error: Option<McpError> = None;

    for space_id in space_ids {
        match client.list_child_nodes(space_id, None) {
            Ok(_) => accessible_space_ids.push(space_id.clone()),
            Err(error) => {
                log_discovery("probe_configured_spaces", &format!("space_id={space_id}, error={error}"));
                last_error = Some(error);
            }
        }
    }

    if accessible_space_ids.is_empty() {
        return Err(last_error.unwrap_or_else(|| {
            McpError::InvalidResponse("Configured Wiki Space IDs are not accessible".into())
        }));
    }

    Ok(to_knowledge_base_spaces(
        accessible_space_ids
            .into_iter()
            .map(|space_id| {
                let name = if space_id.chars().count() > 12 {
                    format!("知识空间 {}", &space_id[..12])
                } else {
                    format!("知识空间 {space_id}")
                };
                (space_id, name)
            })
            .collect(),
    ))
}

fn authorized_config_for_session(
    app: &AppHandle,
    settings: &AppSettings,
) -> Result<(StoredUserSession, FeishuOpenApiConfig), ConnectionCheckResult> {
    if let Err(message) = validate_settings_for_connection(settings) {
        return Err(ConnectionCheckResult {
            user: None,
            spaces: vec![],
            validation: build_validation("not-configured", false, message, None, false),
        });
    }

    let stored = match load_user_session(app) {
        Ok(Some(session)) => session,
        Ok(None) => {
            return Err(build_not_signed_in_result(
                "应用配置已保存，但当前还没有有效的飞书用户登录会话。",
            ))
        }
        Err(error) => {
            return Err(build_reauthorization_required_result(
                "读取当前登录会话失败，请重新授权。",
                Some(error),
            ))
        }
    };

    let session = if token_expiring(stored.access_token_expires_at) {
        match refresh_session(settings, &stored) {
            Ok(refreshed) => {
                let _ = save_user_session(app, &refreshed);
                refreshed
            }
            Err(error) => {
                let _ = clear_user_session(app);
                return Err(build_reauthorization_required_result(
                    "当前登录会话已过期或无法刷新，请重新授权。",
                    Some(error),
                ));
            }
        }
    } else {
        stored
    };

    match app_settings_to_openapi_config(settings, &session) {
        Some(config) => Ok((session, config)),
        None => Err(build_session_expired_result(
            "当前用户登录状态无效，请重新授权后再访问知识库。",
        )),
    }
}

fn resolve_connection_check(app: &AppHandle, settings: &AppSettings) -> ConnectionCheckResult {
    let (session, config) = match authorized_config_for_session(app, settings) {
        Ok(values) => values,
        Err(result) => return result,
    };

    let client = FeishuOpenApiClient::new(config);
    let allowed_space_ids = configured_space_ids(settings);

    match client.list_spaces() {
        Ok(spaces) => {
            log_discovery("list_spaces", &format!("loaded {} spaces", spaces.len()));
            let mut filtered = spaces
                .iter()
                .filter(|space| {
                    allowed_space_ids
                        .as_ref()
                        .map(|ids| ids.iter().any(|id| id == &space.space_id))
                        .unwrap_or(true)
                })
                .map(|space| (space.space_id.clone(), space.name.clone()))
                .collect::<Vec<_>>();

            if filtered.is_empty() {
                if let Some(space_ids) = allowed_space_ids.as_ref() {
                    match probe_configured_spaces(&client, space_ids) {
                        Ok(spaces) => {
                            return build_connected_result(
                                session.user.clone(),
                                spaces,
                                "已通过配置的 Wiki Space IDs 验证到当前登录用户可访问的知识空间。",
                                Some("list_spaces did not return configured spaces; used node probe fallback".into()),
                            );
                        }
                        Err(probe_error) => {
                            log_discovery(
                                "probe_configured_spaces",
                                &format!("fallback probe failed after list_spaces success: {probe_error}"),
                            );

                            let available_space_ids = spaces
                                .iter()
                                .map(|space| space.space_id.clone())
                                .collect::<HashSet<_>>();
                            let matched_space_ids = space_ids
                                .iter()
                                .filter(|space_id| available_space_ids.contains(*space_id))
                                .cloned()
                                .collect::<Vec<_>>();

                            if matched_space_ids.is_empty() && !spaces.is_empty() {
                                return build_empty_connected_result(
                                    session.user.clone(),
                                    format!(
                                        "当前登录用户可访问知识空间，但未发现与 `Wiki Space IDs` 匹配的知识空间：{}。",
                                        space_ids.join(", ")
                                    ),
                                    Some(format!(
                                        "loaded {} spaces, none matched configured ids",
                                        spaces.len()
                                    )),
                                );
                            }

                            return ConnectionCheckResult {
                                user: None,
                                spaces: vec![],
                                validation: classify_discovery_error(
                                    &probe_error,
                                    "configured_space_probe_after_empty_filter",
                                ),
                            };
                        }
                    }
                }

                return build_empty_connected_result(
                    session.user.clone(),
                    "当前登录用户下没有可访问的知识空间。请确认账号已加入至少一个知识空间。",
                    Some("list_spaces succeeded with zero accessible spaces".into()),
                );
            }

            filtered.sort_by(|left, right| left.1.cmp(&right.1));
            let selected_spaces = to_knowledge_base_spaces(filtered);
            let selected_space_count = selected_spaces.len();
            build_connected_result(
                session.user,
                selected_spaces,
                format!("登录校验成功，已发现 {} 个当前账号可访问的知识空间。", selected_space_count),
                None,
            )
        }
        Err(list_error) => {
            log_discovery("list_spaces", &format!("request failed: {list_error}"));
            if let Some(space_ids) = allowed_space_ids.as_ref() {
                match probe_configured_spaces(&client, space_ids) {
                    Ok(spaces) => {
                        return build_connected_result(
                            session.user.clone(),
                            spaces,
                            "知识空间列表接口未返回可用结果，但已通过配置的 Wiki Space IDs 验证到当前登录用户可访问空间。",
                            Some(format!("list_spaces failed before configured-id probe succeeded: {list_error}")),
                        );
                    }
                    Err(probe_error) => {
                        return ConnectionCheckResult {
                            user: None,
                            spaces: vec![],
                            validation: classify_discovery_error(
                                &probe_error,
                                &format!("list_spaces_failed_then_probe_failed; list_spaces_error={list_error}"),
                            ),
                        };
                    }
                }
            }

            ConnectionCheckResult {
                user: None,
                spaces: vec![],
                validation: classify_discovery_error(&list_error, "list_spaces"),
            }
        }
    }
}

fn collect_nodes_recursive(
    client: &FeishuOpenApiClient,
    space_id: &str,
    parent_node_token: Option<&str>,
    out: &mut Vec<FeishuWikiNode>,
) -> Result<(), String> {
    let nodes = client
        .list_child_nodes(space_id, parent_node_token)
        .map_err(|err| err.to_string())?;

    for node in nodes {
        let recurse = node.has_child;
        let node_token = node.node_token.clone();
        out.push(node);
        if recurse {
            collect_nodes_recursive(client, space_id, Some(&node_token), out)?;
        }
    }

    Ok(())
}

fn discover_documents_from_openapi(
    selected_spaces: &[String],
    settings: &AppSettings,
    session: &StoredUserSession,
) -> Result<Vec<KnowledgeBaseDocument>, String> {
    let config = app_settings_to_openapi_config(settings, session)
        .ok_or_else(|| "Feishu OpenAPI user session missing".to_string())?;
    let client = FeishuOpenApiClient::new(config);
    let mut nodes = Vec::new();

    for space_id in selected_spaces {
        collect_nodes_recursive(&client, space_id, None, &mut nodes)?;
    }

    Ok(nodes
        .into_iter()
        .filter(|node| node.obj_type == "docx")
        .map(|node| KnowledgeBaseDocument {
            id: node.obj_token,
            space_id: node.space_id,
            title: node.title,
        })
        .collect())
}

fn configured_mcp_server_name(settings: Option<&AppSettings>) -> String {
    settings
        .map(|settings| settings.mcp_server_name.trim())
        .filter(|value| !value.is_empty())
        .unwrap_or("user-feishu-mcp")
        .to_string()
}

fn configured_image_dir_name(settings: Option<&AppSettings>) -> String {
    settings
        .map(|settings| settings.image_dir_name.trim())
        .filter(|value| !value.is_empty())
        .unwrap_or("_assets")
        .to_string()
}

fn classify_pipeline_failure(error: SyncPipelineError) -> SyncRunError {
    let category = if is_auth_message(&error.message) {
        "auth".to_string()
    } else {
        error.stage
    };
    SyncRunError {
        document_id: String::new(),
        title: String::new(),
        category,
        message: error.message,
    }
}

fn spawn_sync_progress(task_id: String, app: AppHandle) {
    std::thread::spawn(move || {
        let (documents, discovery_error, settings) = {
            let state = app.state::<AppState>();
            let tasks = state.tasks.lock().expect("task state poisoned");
            let selected_spaces = tasks
                .iter()
                .find(|task| task.id == task_id)
                .map(|task| task.selected_spaces.clone())
                .unwrap_or_default();
            drop(tasks);

            let settings: Option<AppSettings> =
                load_json_file(settings_file_path(&app).expect("settings path"))
                    .expect("settings json should load");

            match settings {
                Some(settings) => match authorized_config_for_session(&app, &settings) {
                    Ok((session, _)) => match discover_documents_from_openapi(&selected_spaces, &settings, &session) {
                        Ok(documents) => (documents, None, Some(settings)),
                        Err(error) => (
                            vec![],
                            Some(SyncRunError {
                                document_id: String::new(),
                                title: String::new(),
                                category: if is_auth_message(&error) {
                                    "auth".into()
                                } else {
                                    "discovery".into()
                                },
                                message: error,
                            }),
                            Some(settings),
                        ),
                    },
                    Err(result) => (
                        vec![],
                        Some(SyncRunError {
                            document_id: String::new(),
                            title: String::new(),
                            category: "auth".into(),
                            message: result.validation.message,
                        }),
                        Some(settings),
                    ),
                },
                None => (
                    vec![],
                    Some(SyncRunError {
                        document_id: String::new(),
                        title: String::new(),
                        category: "auth".into(),
                        message: "请先完成飞书配置并重新登录。".into(),
                    }),
                    None,
                ),
            }
        };

        let total_steps = documents.len().max(1) as u32;
        if documents.is_empty() {
            let mut finished_task = None;
            {
                let state = app.state::<AppState>();
                let mut tasks = state.tasks.lock().expect("task state poisoned");
                if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                    task.progress = 100;
                    task.counters.processed = task.counters.total;
                    if let Some(error) = discovery_error.clone() {
                        task.counters.failed = 1;
                        task.counters.succeeded = 0;
                        task.errors = vec![error];
                    }
                    task.failure_summary = build_failure_summary(&task.errors);
                    task.status = if task.errors.is_empty() {
                        "completed".into()
                    } else {
                        "partial-failed".into()
                    };
                    task.lifecycle_state = task.status.clone();
                    task.updated_at = now_iso();
                    finished_task = Some(task.clone());
                }
            }
            if let Some(task) = finished_task {
                {
                    let state = app.state::<AppState>();
                    let tasks = state.tasks.lock().expect("task state poisoned");
                    let _ = save_tasks_to_disk(&app, &tasks);
                }
                let event_name = if task.errors.is_empty() {
                    "sync-task-completed"
                } else {
                    "sync-task-failed"
                };
                emit_task_event(&app, event_name, &task);
            }
            let state = app.state::<AppState>();
            let mut running = state.running_task_ids.lock().expect("running task state poisoned");
            running.remove(&task_id);
            return;
        }

        for (index, document) in documents.iter().enumerate() {
            let step = (index + 1) as u32;
            std::thread::sleep(std::time::Duration::from_millis(400));
            let mcp_server_name = configured_mcp_server_name(settings.as_ref());
            let image_dir_name = configured_image_dir_name(settings.as_ref());
            let state = app.state::<AppState>();
            let mut maybe_emit = None;
            {
                let mut tasks = state.tasks.lock().expect("task state poisoned");
                if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                    let sync_root = PathBuf::from(&task.output_path);
                    let app_settings: Option<AppSettings> =
                        load_json_file(settings_file_path(&app).expect("settings path"))
                            .expect("settings json should load");
                    let fetch_result = if let Some(discovery_error) = discovery_error.as_ref() {
                        Err(discovery_error.clone())
                    } else {
                        match app_settings.as_ref() {
                            Some(settings) => match authorized_config_for_session(&app, settings) {
                                Ok((session, openapi_config)) => {
                                    let _ = save_user_session(&app, &session);
                                    sync_document_to_disk(
                                        &document.id,
                                        &sync_root,
                                        &image_dir_name,
                                        &mcp_server_name,
                                        Some(&openapi_config),
                                    )
                                    .map_err(classify_pipeline_failure)
                                }
                                Err(result) => Err(SyncRunError {
                                    document_id: String::new(),
                                    title: String::new(),
                                    category: "auth".into(),
                                    message: result.validation.message,
                                }),
                            },
                            None => Err(SyncRunError {
                                document_id: String::new(),
                                title: String::new(),
                                category: "auth".into(),
                                message: "请先完成飞书配置并重新登录。".into(),
                            }),
                        }
                    };
                    task.counters.processed = step;
                    task.progress = ((step as f32 / task.counters.total as f32) * 100.0).round() as u32;
                    task.counters.skipped = 0;
                    if let Err(mut error) = fetch_result {
                        task.counters.failed = task.counters.failed.saturating_add(1);
                        error.document_id = document.id.clone();
                        error.title = document.title.clone();
                        task.errors.push(error);
                    }
                    task.counters.succeeded =
                        task.counters.processed.saturating_sub(task.counters.skipped + task.counters.failed);
                    task.failure_summary = build_failure_summary(&task.errors);
                    task.updated_at = now_iso();
                    maybe_emit = Some(task.clone());
                }
            }

            if let Some(task) = maybe_emit {
                {
                    let state = app.state::<AppState>();
                    let tasks = state.tasks.lock().expect("task state poisoned");
                    let _ = save_tasks_to_disk(&app, &tasks);
                }
                emit_task_event(&app, "sync-progress", &task);
                if step == total_steps {
                    let state = app.state::<AppState>();
                    let mut finished_task = None;
                    {
                        let mut tasks = state.tasks.lock().expect("task state poisoned");
                        if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                            if !task.errors.is_empty() {
                                task.status = "partial-failed".into();
                                task.lifecycle_state = "partial-failed".into();
                            } else {
                                task.status = "completed".into();
                                task.lifecycle_state = "completed".into();
                            }
                            task.failure_summary = build_failure_summary(&task.errors);
                            task.updated_at = now_iso();
                            finished_task = Some(task.clone());
                        }
                    }
                    if let Some(task) = finished_task {
                        {
                            let state = app.state::<AppState>();
                            let tasks = state.tasks.lock().expect("task state poisoned");
                            let _ = save_tasks_to_disk(&app, &tasks);
                        }
                        let event_name = if task.errors.is_empty() {
                            "sync-task-completed"
                        } else {
                            "sync-task-failed"
                        };
                        emit_task_event(&app, event_name, &task);
                    }
                }
            }
        }

        let state = app.state::<AppState>();
        let mut running = state.running_task_ids.lock().expect("running task state poisoned");
        running.remove(&task_id);
    });
}

#[tauri::command]
pub fn get_runtime_info() -> RuntimeInfo {
    RuntimeInfo {
        runtime: "tauri",
        version: env!("CARGO_PKG_VERSION"),
    }
}

#[tauri::command]
pub fn get_app_bootstrap(app: AppHandle) -> Result<AppBootstrap, String> {
    let settings: Option<AppSettings> = load_json_file(settings_file_path(&app)?)?;
    let resolved_sync_root = settings
        .as_ref()
        .map(|settings| resolve_sync_root_string(&app, &settings.sync_root))
        .transpose()?;
    let connection_check = settings
        .as_ref()
        .map(|settings| resolve_connection_check(&app, settings));

    let user = connection_check
        .as_ref()
        .and_then(|result| result.user.clone());
    let spaces = connection_check
        .as_ref()
        .map(|result| result.spaces.clone())
        .unwrap_or_default();
    let connection_validation = connection_check.map(|result| result.validation);

    Ok(AppBootstrap {
        settings,
        resolved_sync_root,
        user,
        spaces,
        connection_validation,
    })
}

#[tauri::command]
pub fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<AppSettings, String> {
    save_json_file(settings_file_path(&app)?, &settings)?;
    Ok(settings)
}

#[tauri::command]
pub fn begin_user_authorization(app: AppHandle, redirect_uri: String) -> Result<String, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    build_authorize_url(&settings, &redirect_uri)
}

#[tauri::command]
pub fn complete_user_authorization(
    app: AppHandle,
    code: String,
    redirect_uri: String,
) -> Result<ConnectionCheckResult, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    let token = exchange_user_access_token(&settings.app_id, &settings.app_secret, &code, &redirect_uri)
        .map_err(|err| err.to_string())?;
    let user = fetch_user_info(&settings.endpoint, &token.access_token).map_err(|err| err.to_string())?;
    let session = build_session_from_token(
        token,
        UserInfo {
            name: user.name,
            avatar: user.avatar,
            email: user.email,
            user_id: user.user_id,
        },
    );
    save_user_session(&app, &session)?;
    Ok(resolve_connection_check(&app, &settings))
}

#[tauri::command]
pub fn validate_feishu_connection(app: AppHandle) -> Result<ConnectionCheckResult, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    let result = resolve_connection_check(&app, &settings);
    Ok(result)
}

#[tauri::command]
pub fn logout_user(app: AppHandle) -> Result<(), String> {
    clear_user_session(&app)
}

#[tauri::command]
pub fn list_sync_tasks(app: AppHandle, state: State<'_, AppState>) -> Result<Vec<SyncTask>, String> {
    let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
    if tasks.is_empty() {
        *tasks = load_tasks_from_disk(&app)?;
    }
    Ok(tasks.clone())
}

#[tauri::command]
pub fn create_sync_task(
    app: AppHandle,
    request: CreateSyncTaskRequest,
    state: State<'_, AppState>,
) -> Result<SyncTask, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    let (session, _) = authorized_config_for_session(&app, &settings)
        .map_err(|result| result.validation.message)?;
    let discovered_documents = discover_documents_from_openapi(&request.selected_spaces, &settings, &session)?;
    let resolved_output_path = resolve_sync_root_string(&app, &request.output_path)?;
    fs::create_dir_all(&resolved_output_path).map_err(|err| err.to_string())?;
    with_tasks(&app, state, |tasks| {
        let total = discovered_documents.len().max(1) as u32;
        let created_at = now_iso();
        let task = SyncTask {
            id: Uuid::new_v4().to_string(),
            name: build_task_name(&created_at),
            selected_spaces: request.selected_spaces,
            output_path: resolved_output_path,
            status: "pending".into(),
            progress: 0,
            counters: SyncCounters {
                total,
                processed: 0,
                succeeded: 0,
                skipped: 0,
                failed: 0,
            },
            lifecycle_state: "idle".into(),
            errors: vec![],
            failure_summary: None,
            created_at: created_at.clone(),
            updated_at: created_at,
        };

        tasks.insert(0, task.clone());
        Ok(task)
    })
}

#[tauri::command]
pub fn delete_sync_task(app: AppHandle, task_id: String, state: State<'_, AppState>) -> Result<(), String> {
    with_tasks(&app, state, |tasks| {
        tasks.retain(|task| task.id != task_id);
        Ok(())
    })?;
    let state = app.state::<AppState>();
    let mut running = state.running_task_ids.lock().map_err(|err| err.to_string())?;
    running.remove(&task_id);
    Ok(())
}

#[tauri::command]
pub fn retry_sync_task(task_id: String, app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    with_tasks(&app, state.clone(), |tasks| {
        if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
            task.status = "pending".into();
            task.progress = 0;
            task.lifecycle_state = "preparing".into();
            task.counters.processed = 0;
            task.counters.failed = 0;
            task.counters.succeeded = 0;
            task.errors.clear();
            task.failure_summary = None;
            task.updated_at = now_iso();
        }
        Ok(())
    })?;
    start_sync_task(task_id, app, state)
}

#[tauri::command]
pub fn start_sync_task(task_id: String, app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    authorized_config_for_session(&app, &settings).map_err(|result| result.validation.message)?;
    {
        let mut running = state.running_task_ids.lock().map_err(|err| err.to_string())?;
        if !running.insert(task_id.clone()) {
            return Ok(());
        }
    }
    with_tasks(&app, state, |tasks| {
        if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
            task.status = "syncing".into();
            task.lifecycle_state = "syncing".into();
            task.updated_at = now_iso();
            emit_task_event(&app, "sync-status-changed", task);
        }
        Ok(())
    })?;

    spawn_sync_progress(task_id, app);

    Ok(())
}

#[tauri::command]
pub fn resume_sync_tasks(app: AppHandle, state: State<'_, AppState>) -> Result<Vec<SyncTask>, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    authorized_config_for_session(&app, &settings).map_err(|result| result.validation.message)?;
    {
        let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
        if tasks.is_empty() {
            *tasks = load_tasks_from_disk(&app)?;
        }
    }
    let tasks = state.tasks.lock().map_err(|err| err.to_string())?.clone();

    let resumable: Vec<SyncTask> = tasks
        .into_iter()
        .filter(|task| task.status == "pending" || task.status == "syncing")
        .collect();

    for task in &resumable {
        if task.status == "syncing" {
            let _ = with_tasks(&app, state.clone(), |tasks| {
                if let Some(existing) = tasks.iter_mut().find(|existing| existing.id == task.id) {
                    existing.status = "pending".into();
                    existing.lifecycle_state = "preparing".into();
                    existing.updated_at = now_iso();
                }
                Ok(())
            });
        }
        let _ = start_sync_task(task.id.clone(), app.clone(), app.state::<AppState>());
    }

    Ok(resumable)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    fn sample_user() -> UserInfo {
        UserInfo {
            name: "测试用户".into(),
            avatar: None,
            email: None,
            user_id: Some("ou_test".into()),
        }
    }

    fn sample_space(id: &str, name: &str) -> KnowledgeBaseSpace {
        KnowledgeBaseSpace {
            id: id.into(),
            name: name.into(),
            selected: false,
        }
    }

    #[test]
    fn false_negative_preflight_can_recover_when_spaces_are_accessible() {
        let recovered = build_connected_result(
            sample_user(),
            vec![sample_space("space-a", "研发知识库")],
            "已通过配置的 Wiki Space IDs 验证到可访问的知识空间。",
            Some("list_spaces failed before configured-id probe succeeded".into()),
        );

        assert_eq!(recovered.validation.status, "connected-with-spaces");
        assert!(recovered.validation.usable);
        assert_eq!(recovered.spaces.len(), 1);
    }

    #[test]
    fn permission_errors_are_classified_explicitly() {
        let validation = classify_discovery_error(
            &McpError::Transport("List spaces request failed: permission denied".into()),
            "list_spaces",
        );

        assert_eq!(validation.status, "permission-denied");
        assert!(!validation.usable);
    }

    #[test]
    fn invalid_responses_are_classified_as_unexpected_response() {
        let validation = classify_discovery_error(
            &McpError::InvalidResponse("Space list missing items".into()),
            "list_spaces",
        );

        assert_eq!(validation.status, "unexpected-response");
        assert!(!validation.usable);
    }

    #[test]
    fn empty_connected_result_is_not_treated_as_failure() {
        let result = build_empty_connected_result(
            sample_user(),
            "连接已建立，但当前账号下没有可访问的知识空间。",
            Some("list_spaces succeeded with zero accessible spaces".into()),
        );

        assert_eq!(result.validation.status, "connected-no-spaces");
        assert!(result.validation.usable);
        assert!(result.spaces.is_empty());
        assert_eq!(result.user.as_ref().map(|user| user.name.as_str()), Some("测试用户"));
    }

    #[test]
    fn signed_out_result_is_not_usable() {
        let result = build_not_signed_in_result("需要先登录");

        assert_eq!(result.validation.status, "not-signed-in");
        assert!(!result.validation.usable);
        assert!(result.user.is_none());
    }

    #[test]
    fn normalizes_legacy_system_time_debug_timestamp() {
        let normalized = normalize_timestamp_string("SystemTime { intervals: 134190038946973727 }");

        assert!(chrono::DateTime::parse_from_rfc3339(&normalized).is_ok());
    }

    #[test]
    fn resolves_relative_sync_root_against_base_path() {
        let resolved = resolve_sync_root_from_base(Path::new("C:/Users/test/Documents"), "./synced-docs")
            .expect("sync root should resolve");

        assert_eq!(resolved.to_string_lossy().replace('\\', "/"), "C:/Users/test/Documents/synced-docs");
    }

    #[test]
    fn builds_failure_summary_from_dominant_category() {
        let errors = vec![
            SyncRunError {
                document_id: "doc-1".into(),
                title: "文档一".into(),
                category: "content-fetch".into(),
                message: "内容接口返回 400".into(),
            },
            SyncRunError {
                document_id: "doc-2".into(),
                title: "文档二".into(),
                category: "content-fetch".into(),
                message: "内容接口返回 400".into(),
            },
            SyncRunError {
                document_id: "doc-3".into(),
                title: "文档三".into(),
                category: "filesystem-write".into(),
                message: "磁盘写入失败".into(),
            },
        ];

        let summary = build_failure_summary(&errors).expect("summary should exist");

        assert_eq!(summary.category, "content-fetch");
        assert_eq!(summary.count, 2);
        assert!(summary.message.contains("内容抓取"));
    }
}
