mod axum;
mod db_chats;
mod db_config;
mod constants;
mod error;
mod ipc_chats;
mod ipc_convex;
mod ipc_pastebin;
mod ipc_utils;
mod db_pastebin;
mod prelude;
mod utils;

use crate::axum::init_chat_api;
use crate::db_config::init_app_config;
use crate::prelude::*;
use crate::utils::Utils;
use crate::{Db, DifferState};
use convex::ConvexClient;
use std::env;
use tauri::{self, Emitter};
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> AppResult<()> {
    Utils::init_env_variables();

    // Absolutely required env variables
    for key in ["VITE_CONVEX_URL", "VITE_CONVEX_SITE_URL"] {
        if std::env::var(key).is_err() {
            panic!("Missing required env var: {key}");
        }
    }

    let db = Utils::setup_db().await?;

    if let Err(err) = init_app_config(&db).await {
        panic!("Config error: {}", err)
    };

    let deployment_url = dotenvy::var("VITE_CONVEX_URL")
        .expect("[VITE_CONVEX_URL] is required, it must end with .cloud");

    let convex_client = match ConvexClient::new(deployment_url.as_str()).await {
        Ok(c) => c,
        Err(_) => panic!("Unable to establish a convex client instance."),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(DbOnlyState {
            db: db.clone(),
            convex_client: convex_client.clone(),
        })
        .manage(Mutex::new(DifferState {
            convex_task_status: TaskStatus::Initialized,
            chat_api_task_status: TaskStatus::Initialized,
        }))
        .setup(|app| {
            let app_handle = app.handle();

            init_chat_api(app_handle, db)?;

            Ok(())
        })
        .on_window_event(|window, ev| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = ev {
                // Prevent default
                api.prevent_close();

                // Seamlessly terminate all services
                window
                    .emit("app_close", None::<bool>)
                    .expect("should have been able to emit app_close event.");

                window
                    .destroy()
                    .expect("should have destroyed the current window.");
            }
        })
        .invoke_handler(tauri::generate_handler![
            ipc_convex::cmd_convex_query,
            ipc_utils::cmd_open_url,
            ipc_utils::cmd_read_file,
            ipc_utils::cmd_get_app_config,
            ipc_utils::cmd_get_all_tasks,
            ipc_utils::cmd_update_app_config,
            ipc_utils::cmd_query_convex_task_status,
            ipc_chats::cmd_get_chat_by_id,
            ipc_chats::cmd_get_chat_api_endpoint,
            ipc_chats::cmd_save_initial_chat,
            ipc_chats::cmd_update_chat_message,
            ipc_chats::cmd_find_recent_chats,
            ipc_chats::cmd_delete_chat_by_id,
            ipc_pastebin::cmd_is_synced,
            ipc_pastebin::cmd_sync_app_to_remote_server,
            ipc_pastebin::cmd_get_paste_by_id,
            ipc_pastebin::cmd_save_remote_paste,
            ipc_pastebin::cmd_find_recent_local_pastes,
            ipc_pastebin::cmd_delete_remote_paste_by_id,
            ipc_pastebin::cmd_delete_local_paste_by_id,
            ipc_pastebin::cmd_save_remote_paste_locally,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
