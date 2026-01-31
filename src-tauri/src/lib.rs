mod axum;
mod constants;
mod db_chats;
mod db_config;
mod db_pastebin;
mod error;
mod ipc_chats;
mod ipc_convex;
mod ipc_pastebin;
mod ipc_utils;
mod prelude;
mod utils;

use crate::axum::init_chat_api;
use crate::db_config::init_app_config;
use crate::prelude::*;
use crate::utils::{init_tracer, Utils};
use crate::{Db, DifferState};
use convex::ConvexClient;
use opentelemetry::trace::{Span, Status};
use opentelemetry::{global, trace::Tracer};
use std::env;
use tauri::{self, Emitter};
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> AppResult<()> {
    Utils::init_env_variables();

    let uptrace_dsn =
        std::env::var("UPTRACE_DSN").expect("UPTRACE_DSN is required for opentelemetry");

    let provider = init_tracer(uptrace_dsn)?;
    global::set_tracer_provider(provider.clone());

    let tracer = global::tracer("tauri_setup");

    // Absolutely required env variables
    for key in ["VITE_CONVEX_URL", "VITE_CONVEX_SITE_URL"] {
        if std::env::var(key).is_err() {
            panic!("Missing required env var: {key}");
        }
    }

    let mut span = tracer.start("setup_db");

    let db = match Utils::setup_db().await {
        Ok(pool) => pool,
        Err(err) => {
            span.record_error(err.as_ref());
            span.set_status(Status::error(err.to_string()));
            panic!("Database setup failed.")
        }
    };

    span.end();

    let mut span = tracer.start("init_app_config");
    if let Err(err) = init_app_config(&db).await {
        span.record_error(err.as_ref());
        span.set_status(Status::error(err.to_string()));
        panic!("Config error: {}", err)
    };

    span.end();

    let deployment_url = dotenvy::var("VITE_CONVEX_URL")
        .expect("[VITE_CONVEX_URL] is required, it must end with .cloud");

    let convex_client = match ConvexClient::new(deployment_url.as_str()).await {
        Ok(c) => c,
        Err(_) => panic!("Unable to establish a convex client instance."),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
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
        .setup(move |app| {
            let app_handle = app.handle();

            let _ = tracer.in_span("init_chat_api", |_| {
                init_chat_api(app_handle, db)?;

                Ok::<(), anyhow::Error>(())
            });

            Ok(())
        })
        .on_window_event(move |window, ev| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = ev {
                // Prevent default
                api.prevent_close();

                provider.force_flush().ok();
                provider.shutdown().ok();

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
