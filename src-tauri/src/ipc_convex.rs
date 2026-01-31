use crate::db_config::get_app_config;
use crate::prelude::*;
use convex::ConvexClient;
use convex::FunctionResult;
use convex::Value;
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use tauri::Listener;
use tauri::Manager;
use tauri::{self, AppHandle, Emitter, EventTarget};

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_convex_query(app: AppHandle) -> anyhow::Result<(), AppError> {
    let app2 = app.clone();

    let mutx_state = app2.state::<AppState>();

    let state = app.state::<DbOnlyState>();
    let db = state.db.clone();

    let mut client = state.convex_client.clone();

    let (cancel_tx, mut cancel_rx) = tokio::sync::watch::channel(false);

    // Drop mutex
    {
        let guard = mutx_state.lock().await;

        let task_status = guard.convex_task_status.clone();

        println!("Task status: {:?}", task_status);

        if let TaskStatus::Operational = task_status {
            return Ok(());
        }
    }

    tauri::async_runtime::spawn(async move {
        let mutx_state = app.state::<AppState>();

        let handle = app.app_handle();
        let config = get_app_config(db).await.map_err(to_app_err)?;

        let cancel_tx2 = cancel_tx.clone();

        let on_app_close: u32 = app.listen_any("app_close", move |_| {
            cancel_tx.send(true).ok();
            println!("Emitting 'app_close' event.")
        });

        let on_query_close: u32 = handle.listen_any("cmd_convex_query_close", move |_| {
            cancel_tx2.send(true).ok();
            println!("Emitting 'cmd_convex_query_close' event.")
        });

        let fn_path = "fns:get_recent_pastes";

        let recent_pastes = client.subscribe(
            fn_path,
            maplit::btreemap! {
                "app_id".to_string() => config.app_id.into()
            },
        );

        let mut subscription = match recent_pastes.await {
            Ok(sub) => {
                let mut guard = mutx_state.lock().await;
                guard.convex_task_status = TaskStatus::Operational;
                sub
            }
            Err(err) => {
                let mut guard = mutx_state.lock().await;
                guard.convex_task_status = TaskStatus::Panicked {
                    error: err.to_string(),
                };

                println!("Convex subscription failed {:?}", err);

                return Err(to_app_err(err));
            }
        };

        loop {
            tokio::select! {
                result = subscription.next() => {
                    let Some(result) = result else {
                        println!("There is not subscription at the moment.");
                        let mut guard = mutx_state.lock().await;
                        guard.convex_task_status = TaskStatus::Initialized;
                        break;
                    };

                    match result {
                        FunctionResult::Value(x) => {
                            let json_value = x.export();

                            println!("Value: {:?}", json_value);

                            let history: Vec<RemotePastes> =
                                serde_json::from_value(json_value)
                                .context("Failed to deserialize json value.")
                                .map_err(to_app_err)?;

                            handle
                                .emit_to(EventTarget::any(), "get_value", history)
                                .context("failed to emit value for convex subscription")
                                .map_err(to_app_err)?;
                        }
                        FunctionResult::ConvexError(err) => {
                            println!("Error: {:?}", err);

                            handle
                                .emit_to(EventTarget::any(), "convex_error", err.to_string())
                                .context(format!("Convex error: {}", err))
                                .map_err(to_app_err)?;
                        }
                        FunctionResult::ErrorMessage(err_msg) => {
                            println!("Error message: {}", err_msg);
                            handle
                                .emit_to(EventTarget::any(), "error_message", &err_msg)
                                .context(format!("Error message: {}", err_msg))
                                .map_err(to_app_err)?;
                        }
                    }

                }

                _ = cancel_rx.changed() => {
                    println!("Terminating convex query subscription.");
                    handle.unlisten(on_app_close);
                    handle.unlisten(on_query_close);

                    // Reset task_status
                    let mut guard = mutx_state.lock().await;
                    guard.convex_task_status = TaskStatus::Initialized;

                    break;
                }
            }
        }

        Ok::<(), AppError>(())
    });

    Ok(())
}

pub async fn convex_delete_paste(
    mut convex_client: ConvexClient,
    args: BTreeMap<String, Value>,
) -> anyhow::Result<(), AppError> {
    let result = convex_client
        .mutation("fns:deletePaste", args)
        .await
        .map_err(to_app_err)?;

    match result {
        FunctionResult::Value(value) => {
            let json_value = value.export();

            Ok(serde_json::from_value::<()>(json_value)?)
        }
        FunctionResult::ConvexError(err) => Err(AppError::Convex(err.to_string())),
        FunctionResult::ErrorMessage(err_msg) => Err(AppError::Convex(err_msg)),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RemotePastes {
    #[serde(rename = "_id")]
    pub id: String,

    #[serde(rename = "appId")]
    pub app_id: String,

    #[serde(rename = "accountId")]
    pub account_id: String,

    pub body: String,

    #[serde(rename = "_creationTime")]
    pub creation_time: f64,
}
