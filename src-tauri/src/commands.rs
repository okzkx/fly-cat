use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};
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
pub struct AppBootstrap {
    pub settings: Option<AppSettings>,
    pub user: Option<UserInfo>,
    pub spaces: Vec<KnowledgeBaseSpace>,
}

#[derive(Clone)]
struct KnowledgeBaseDocument {
    id: &'static str,
    space_id: &'static str,
    title: &'static str,
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

fn knowledge_base_spaces() -> Vec<KnowledgeBaseSpace> {
    vec![
        KnowledgeBaseSpace {
            id: "kb-eng".into(),
            name: "研发知识库".into(),
            selected: true,
        },
        KnowledgeBaseSpace {
            id: "kb-product".into(),
            name: "产品知识库".into(),
            selected: false,
        },
        KnowledgeBaseSpace {
            id: "kb-ops".into(),
            name: "运维知识库".into(),
            selected: false,
        },
    ]
}

fn knowledge_base_catalog() -> Vec<KnowledgeBaseDocument> {
    vec![
        KnowledgeBaseDocument {
            id: "doc-eng-architecture",
            space_id: "kb-eng",
            title: "研发架构设计",
        },
        KnowledgeBaseDocument {
            id: "doc-eng-api",
            space_id: "kb-eng",
            title: "研发API概览",
        },
        KnowledgeBaseDocument {
            id: "doc-product-overview",
            space_id: "kb-product",
            title: "Product Overview",
        },
        KnowledgeBaseDocument {
            id: "doc-product-roadmap",
            space_id: "kb-product",
            title: "产品路线图",
        },
        KnowledgeBaseDocument {
            id: "doc-ops-playbook",
            space_id: "kb-ops",
            title: "运维值班手册",
        },
    ]
}

fn discover_documents(selected_spaces: &[String]) -> Vec<KnowledgeBaseDocument> {
    knowledge_base_catalog()
        .into_iter()
        .filter(|document| selected_spaces.iter().any(|space| space == document.space_id))
        .collect()
}

fn spawn_sync_progress(task_id: String, app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let total_steps = {
            let state = app.state::<AppState>();
            let tasks = state.tasks.lock().expect("task state poisoned");
            tasks
                .iter()
                .find(|task| task.id == task_id)
                .map(|task| task.counters.total)
                .unwrap_or(1)
        };

        for step in 1..=total_steps {
            std::thread::sleep(std::time::Duration::from_millis(400));
            let state = app.state::<AppState>();
            let mut maybe_emit = None;
            {
                let mut tasks = state.tasks.lock().expect("task state poisoned");
                if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                    task.counters.processed = step;
                    task.progress = ((step as f32 / task.counters.total as f32) * 100.0).round() as u32;
                    task.counters.skipped = if task.selected_spaces.len() > 1 { 1 } else { 0 };
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
                            if task.selected_spaces.iter().any(|space| space == "kb-product") {
                                let failed_doc = discover_documents(&task.selected_spaces)
                                    .into_iter()
                                    .find(|document| document.space_id == "kb-product");
                                task.status = "partial-failed".into();
                                task.lifecycle_state = "partial-failed".into();
                                task.counters.failed = 1;
                                task.counters.succeeded = task.counters.total.saturating_sub(1 + task.counters.skipped);
                                task.errors = failed_doc
                                    .map(|document| SyncRunError {
                                        document_id: document.id.into(),
                                        title: document.title.into(),
                                        category: "mcp".into(),
                                        message: "MCP request timeout".into(),
                                    })
                                    .into_iter()
                                    .collect();
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
    let user = load_json_file(user_file_path(&app)?)?;
    let spaces = knowledge_base_spaces();

    Ok(AppBootstrap { settings, user, spaces })
}

#[tauri::command]
pub fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<AppSettings, String> {
    save_json_file(settings_file_path(&app)?, &settings)?;
    Ok(settings)
}

#[tauri::command]
pub fn authorize_mock_user(app: AppHandle) -> Result<UserInfo, String> {
    let user = UserInfo {
        name: "同步测试用户".into(),
        avatar: None,
    };
    save_json_file(user_file_path(&app)?, &user)?;
    Ok(user)
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
    with_tasks(&app, state, |tasks| {
        let discovered_documents = discover_documents(&request.selected_spaces);
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
