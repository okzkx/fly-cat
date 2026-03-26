use crate::mcp::{FeishuOpenApiClient, FeishuOpenApiConfig, FeishuWikiNode, McpError};
use crate::sync::sync_document_to_disk;
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, fs, path::PathBuf, sync::Mutex};
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
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub name: String,
    pub avatar: Option<String>,
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
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    pub runtime: &'static str,
    pub version: &'static str,
}

fn now_iso() -> String {
    format!("{:?}", std::time::SystemTime::now())
}

fn settings_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    Ok(app_data_dir.join("app-settings.json"))
}

fn user_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    Ok(app_data_dir.join("auth-user.json"))
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
    serde_json::from_str(&content).map_err(|err| err.to_string())
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

fn app_settings_to_openapi_config(settings: &AppSettings) -> Option<FeishuOpenApiConfig> {
    if settings.app_id.trim().is_empty() || settings.app_secret.trim().is_empty() {
        return None;
    }

    Some(FeishuOpenApiConfig {
        app_id: settings.app_id.clone(),
        app_secret: settings.app_secret.clone(),
        endpoint: settings.endpoint.clone(),
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

fn build_connected_user(spaces: &[KnowledgeBaseSpace]) -> UserInfo {
    UserInfo {
        name: format!("已连接_{}个知识空间", spaces.len()),
        avatar: None,
    }
}

fn build_connected_result(
    spaces: Vec<KnowledgeBaseSpace>,
    message: impl Into<String>,
    diagnostics: Option<String>,
) -> ConnectionCheckResult {
    let user = Some(build_connected_user(&spaces));
    ConnectionCheckResult {
        user,
        spaces,
        validation: build_validation("connected-with-spaces", true, message, diagnostics, true),
    }
}

fn build_empty_connected_result(message: impl Into<String>, diagnostics: Option<String>) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: Some(build_connected_user(&[])),
        spaces: vec![],
        validation: build_validation("connected-no-spaces", true, message, diagnostics, true),
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

fn resolve_connection_check(settings: &AppSettings) -> ConnectionCheckResult {
    if let Err(message) = validate_settings_for_connection(settings) {
        return ConnectionCheckResult {
            user: None,
            spaces: vec![],
            validation: build_validation("not-configured", false, message, None, false),
        };
    }

    let config = match app_settings_to_openapi_config(settings) {
        Some(config) => config,
        None => {
            return ConnectionCheckResult {
                user: None,
                spaces: vec![],
                validation: build_validation(
                    "not-configured",
                    false,
                    "飞书 OpenAPI 配置不完整，请检查 App ID / App Secret / Endpoint。",
                    None,
                    false,
                ),
            }
        }
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
                                spaces,
                                "已通过配置的 Wiki Space IDs 验证到可访问的知识空间。",
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
                                    format!(
                                        "当前连接可用，但未发现与 `Wiki Space IDs` 匹配的知识空间：{}。",
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
                    "连接已建立，但当前账号下没有可访问的知识空间。请确认应用已被加入至少一个知识空间。",
                    Some("list_spaces succeeded with zero accessible spaces".into()),
                );
            }

            filtered.sort_by(|left, right| left.1.cmp(&right.1));
            let selected_spaces = to_knowledge_base_spaces(filtered);
            let selected_space_count = selected_spaces.len();
            build_connected_result(
                selected_spaces,
                format!("连接校验成功，已发现 {} 个可访问知识空间。", selected_space_count),
                None,
            )
        }
        Err(list_error) => {
            log_discovery("list_spaces", &format!("request failed: {list_error}"));
            if let Some(space_ids) = allowed_space_ids.as_ref() {
                match probe_configured_spaces(&client, space_ids) {
                    Ok(spaces) => {
                        return build_connected_result(
                            spaces,
                            "知识空间列表接口未返回可用结果，但已通过配置的 Wiki Space IDs 验证到可访问空间。",
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
) -> Result<Vec<KnowledgeBaseDocument>, String> {
    let config = app_settings_to_openapi_config(settings).ok_or_else(|| "Feishu OpenAPI config missing".to_string())?;
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

fn default_mcp_server_name() -> String {
    "user-feishu-mcp".into()
}

fn default_image_dir_name() -> String {
    "_assets".into()
}

fn spawn_sync_progress(task_id: String, app: AppHandle) {
    std::thread::spawn(move || {
        let documents = {
            let state = app.state::<AppState>();
            let tasks = state.tasks.lock().expect("task state poisoned");
            tasks
                .iter()
                .find(|task| task.id == task_id)
                .map(|task| discover_documents(&task.selected_spaces))
                .unwrap_or_default()
        };

        let total_steps = documents.len().max(1) as u32;
        let documents = if documents.is_empty() {
            vec![KnowledgeBaseDocument {
                id: "doc-empty".into(),
                space_id: "kb-eng".into(),
                title: "Empty Placeholder".into(),
            }]
        } else {
            documents
        };

        for (index, document) in documents.iter().enumerate() {
            let step = (index + 1) as u32;
            std::thread::sleep(std::time::Duration::from_millis(400));
            let mcp_server_name = default_mcp_server_name();
            let image_dir_name = default_image_dir_name();
            let state = app.state::<AppState>();
            let mut maybe_emit = None;
            {
                let mut tasks = state.tasks.lock().expect("task state poisoned");
                if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                    let sync_root = PathBuf::from(&task.output_path);
                    let app_settings: Option<AppSettings> =
                        load_json_file(settings_file_path(&app).expect("settings path"))
                            .expect("settings json should load");
                    let openapi_config =
                        app_settings.as_ref().and_then(app_settings_to_openapi_config);
                    let fetch_result =
                        sync_document_to_disk(&document.id, &sync_root, &image_dir_name, &mcp_server_name, openapi_config.as_ref());
                    task.counters.processed = step;
                    task.progress = ((step as f32 / task.counters.total as f32) * 100.0).round() as u32;
                    task.counters.skipped = 0;
                    if let Err(error) = fetch_result {
                        task.counters.failed += 1;
                        task.errors.push(SyncRunError {
                            document_id: document.id.clone(),
                            title: document.title.clone(),
                            category: "mcp".into(),
                            message: error.to_string(),
                        });
                    }
                    task.counters.succeeded =
                        task.counters.processed.saturating_sub(task.counters.skipped + task.counters.failed);
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
    let settings = load_json_file(settings_file_path(&app)?)?;
    let persisted_user: Option<UserInfo> = load_json_file(user_file_path(&app)?)?;
    let connection_check = settings.as_ref().map(resolve_connection_check);

    let user = connection_check
        .as_ref()
        .and_then(|result| result.validation.usable.then(|| result.user.clone()).flatten())
        .or(persisted_user.filter(|_| connection_check.is_none()));
    let spaces = connection_check
        .as_ref()
        .map(|result| result.spaces.clone())
        .unwrap_or_default();
    let connection_validation = connection_check.map(|result| result.validation);

    Ok(AppBootstrap {
        settings,
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
pub fn validate_feishu_connection(app: AppHandle) -> Result<ConnectionCheckResult, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    let result = resolve_connection_check(&settings);

    if result.validation.usable {
        if let Some(user) = result.user.as_ref() {
            save_json_file(user_file_path(&app)?, user)?;
        }
    } else {
        let user_path = user_file_path(&app)?;
        if user_path.exists() {
            fs::remove_file(user_path).map_err(|err| err.to_string())?;
        }
    }

    Ok(result)
}

#[tauri::command]
pub fn logout_user(app: AppHandle) -> Result<(), String> {
    let user_path = user_file_path(&app)?;
    if user_path.exists() {
        fs::remove_file(user_path).map_err(|err| err.to_string())?;
    }
    Ok(())
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
    let settings: Option<AppSettings> = load_json_file(settings_file_path(&app)?)?;
    with_tasks(&app, state, |tasks| {
        let discovered_documents = settings
            .as_ref()
            .and_then(|settings| discover_documents_from_openapi(&request.selected_spaces, settings).ok())
            .filter(|documents| !documents.is_empty())
            .unwrap_or_else(|| discover_documents(&request.selected_spaces));
        let total = discovered_documents.len().max(1) as u32;
        let task = SyncTask {
            id: Uuid::new_v4().to_string(),
            name: format!("同步任务 - {}", now_iso()),
            selected_spaces: request.selected_spaces,
            output_path: request.output_path,
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
            created_at: now_iso(),
            updated_at: now_iso(),
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
    })
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
            task.updated_at = now_iso();
        }
        Ok(())
    })?;
    start_sync_task(task_id, app, state)
}

#[tauri::command]
pub fn start_sync_task(task_id: String, app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
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
        let _ = start_sync_task(task.id.clone(), app.clone(), app.state::<AppState>());
    }

    Ok(resumable)
}

#[cfg(test)]
mod tests {
    use super::*;

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
            "连接已建立，但当前账号下没有可访问的知识空间。",
            Some("list_spaces succeeded with zero accessible spaces".into()),
        );

        assert_eq!(result.validation.status, "connected-no-spaces");
        assert!(result.validation.usable);
        assert!(result.spaces.is_empty());
        assert_eq!(result.user.as_ref().map(|user| user.name.as_str()), Some("已连接_0个知识空间"));
    }
}
