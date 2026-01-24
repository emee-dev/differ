mod axum;
mod chats_cmd;
mod chats_utils;
mod config;
mod convex;
mod error;
mod prelude;
mod utils;
mod utils_cmd;

use crate::axum::init_chat_api;
use crate::config::init_app_config;
use crate::convex::init_subscriptions;
use crate::prelude::*;
use crate::utils::Utils;
use crate::{Db, DifferState};
use std::env;
use std::sync::Mutex;
use tauri::EventTarget;
use tauri::{self, Emitter};
use tokio::sync::watch;
use utils_cmd::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> AppResult<()> {
    let db = Utils::setup_db().await?;

    let (thread_shutdown_tx, mut thread_shutdown_rx) =
        watch::channel(AppError::InitialServiceState);

    if let Err(err) = init_app_config(&db).await {
        panic!("Config error: {}", err)
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(DbOnlyState { db: db.clone() })
        .manage(Mutex::new(DifferState {
            db: db.clone(),
            chat_api_endpoint: Some("".to_string()),
        }))
        .setup(move |app| {
            let subscription_handle = app.handle().clone();
            let thread_error_handle = app.handle().clone();
            let chat_api_handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                while thread_shutdown_rx.changed().await.is_ok() {
                    let service_error = thread_shutdown_rx.borrow().clone();

                    // Allow the user to gracefully terminate app.
                    match service_error {
                        AppError::ChatAPI(msg) => {
                            thread_error_handle
                                .emit_to(EventTarget::any(), "service_error", msg)
                                .ok();
                        }
                        AppError::Convex(msg) => {
                            thread_error_handle
                                .emit_to(EventTarget::any(), "service_error", msg)
                                .ok();
                        }

                        _ => todo!(),
                    }
                }
            });

            init_subscriptions(subscription_handle, db.clone(), thread_shutdown_tx.clone())?;
            init_chat_api(chat_api_handle, db, thread_shutdown_tx)?;

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
            cmd_read_file,
            cmd_get_app_config,
            cmd_update_app_config,
            chats_cmd::cmd_get_chat_by_id,
            chats_cmd::cmd_get_chat_api_endpoint,
            chats_cmd::cmd_save_initial_chat,
            chats_cmd::cmd_update_chat_message,
            chats_cmd::cmd_find_recent_chats,
            chats_cmd::cmd_delete_chat_by_id
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
