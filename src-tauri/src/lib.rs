mod commands;
mod mcp;
mod model;
mod render;
mod storage;
mod sync;

use commands::{
    begin_user_authorization, check_document_freshness, clear_all_sync_tasks, clear_freshness_metadata,
    complete_user_authorization, create_sync_task, delete_sync_task, get_app_bootstrap,
    get_document_sync_statuses, get_runtime_info, get_synced_document_ids, list_space_source_tree,
    list_sync_tasks, load_freshness_metadata, logout_user, open_workspace_folder,
    remove_synced_documents, resume_sync_tasks, retry_sync_task, save_app_settings,
    save_freshness_metadata, start_sync_task, validate_feishu_connection, AppState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            get_runtime_info,
            get_synced_document_ids,
            get_document_sync_statuses,
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
            delete_sync_task,
            clear_all_sync_tasks,
            remove_synced_documents,
            check_document_freshness,
            load_freshness_metadata,
            save_freshness_metadata,
            clear_freshness_metadata,
            open_workspace_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
