use serde::{Deserialize, Serialize};
use std::sync::Mutex;
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

fn emit_task_event(app: &AppHandle, event_name: &str, task: &SyncTask) {
    let _ = app.emit(event_name, task.clone());
}

fn spawn_sync_progress(task_id: String, app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        for step in 1..=6 {
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
                emit_task_event(&app, "sync-progress", &task);
                if step == 6 {
                    let state = app.state::<AppState>();
                    let mut finished_task = None;
                    {
                        let mut tasks = state.tasks.lock().expect("task state poisoned");
                        if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                            if task.selected_spaces.iter().any(|space| space == "kb-product") {
                                task.status = "partial-failed".into();
                                task.lifecycle_state = "partial-failed".into();
                                task.counters.failed = 1;
                                task.counters.succeeded = task.counters.total.saturating_sub(1 + task.counters.skipped);
                                task.errors = vec![SyncRunError {
                                    document_id: "doc-product-overview".into(),
                                    title: "Product Overview".into(),
                                    category: "mcp".into(),
                                    message: "MCP request timeout".into(),
                                }];
                            } else {
                                task.status = "completed".into();
                                task.lifecycle_state = "completed".into();
                            }
                            task.updated_at = now_iso();
                            finished_task = Some(task.clone());
                        }
                    }
                    if let Some(task) = finished_task {
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
pub fn list_sync_tasks(state: State<'_, AppState>) -> Result<Vec<SyncTask>, String> {
    let tasks = state.tasks.lock().map_err(|err| err.to_string())?;
    Ok(tasks.clone())
}

#[tauri::command]
pub fn create_sync_task(request: CreateSyncTaskRequest, state: State<'_, AppState>) -> Result<SyncTask, String> {
    let task = SyncTask {
        id: Uuid::new_v4().to_string(),
        name: format!("同步任务 - {}", now_iso()),
        selected_spaces: request.selected_spaces,
        output_path: request.output_path,
        status: "pending".into(),
        progress: 0,
        counters: SyncCounters {
            total: 6,
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

    let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
    tasks.insert(0, task.clone());
    Ok(task)
}

#[tauri::command]
pub fn delete_sync_task(task_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
    tasks.retain(|task| task.id != task_id);
    Ok(())
}

#[tauri::command]
pub fn retry_sync_task(task_id: String, app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    {
        let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
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
    }
    start_sync_task(task_id, app, state)
}

#[tauri::command]
pub fn start_sync_task(task_id: String, app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    {
        let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
        if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
            task.status = "syncing".into();
            task.lifecycle_state = "syncing".into();
            task.updated_at = now_iso();
            emit_task_event(&app, "sync-status-changed", task);
        }
    }

    spawn_sync_progress(task_id, app);

    Ok(())
}

#[tauri::command]
pub fn resume_sync_tasks(app: AppHandle, state: State<'_, AppState>) -> Result<Vec<SyncTask>, String> {
    let tasks = {
        let tasks = state.tasks.lock().map_err(|err| err.to_string())?;
        tasks.clone()
    };

    let resumable: Vec<SyncTask> = tasks
        .into_iter()
        .filter(|task| task.status == "pending" || task.status == "syncing")
        .collect();

    for task in &resumable {
        let _ = start_sync_task(task.id.clone(), app.clone(), app.state::<AppState>());
    }

    Ok(resumable)
}
