mod commands;

use commands::{
    authorize_mock_user, create_sync_task, delete_sync_task, get_app_bootstrap,
    get_runtime_info, list_sync_tasks, logout_user, retry_sync_task, resume_sync_tasks,
    save_app_settings, start_sync_task, AppState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            get_runtime_info,
            get_app_bootstrap,
            save_app_settings,
            authorize_mock_user,
            logout_user,
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
