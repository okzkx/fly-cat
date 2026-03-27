mod mcp;
mod model;
mod render;
mod storage;
mod sync;
mod commands;

use commands::{
    begin_user_authorization, complete_user_authorization, create_sync_task, delete_sync_task, get_app_bootstrap,
    get_runtime_info, list_space_source_tree, list_sync_tasks, logout_user, retry_sync_task, resume_sync_tasks,
    save_app_settings, start_sync_task, validate_feishu_connection, AppState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            get_runtime_info,
            get_app_bootstrap,
            save_app_settings,
            begin_user_authorization,
            complete_user_authorization,
            validate_feishu_connection,
            list_space_source_tree,
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
