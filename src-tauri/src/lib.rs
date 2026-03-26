mod commands;

use commands::{
    create_sync_task, delete_sync_task, get_runtime_info, list_sync_tasks, retry_sync_task,
    resume_sync_tasks, start_sync_task, AppState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            get_runtime_info,
            list_sync_tasks,
            create_sync_task,
            start_sync_task,
            retry_sync_task,
            resume_sync_tasks,
            delete_sync_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
