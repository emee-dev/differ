use crate::config::get_app_config;
use crate::prelude::*;
use convex::{ConvexClient, FunctionResult};
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::Listener;
use tauri::{self, AppHandle, Emitter, EventTarget};
use tokio::sync::watch::Sender;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RemotePasteBinHistory {
    #[serde(rename = "_id")]
    pub uuid: String,

    #[serde(rename = "accountId")]
    pub account_id: String,

    pub body: String,

    #[serde(rename = "_creationTime")]
    pub creation_time: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalPasteBinHistory {
    #[serde(rename = "_id")]
    pub uuid: String,

    #[serde(rename = "accountId")]
    pub account_id: String,

    pub body: String,

    #[serde(rename = "_creationTime")]
    pub creation_time: f64,

    // flag
    #[serde(rename = "isLocal")]
    pub is_local: bool,
}

pub fn init_subscriptions(
    app: AppHandle,
    db: Db,
    thread_shutdown_tx: Sender<AppError>,
) -> AppResult<()> {
    let (cancel_tx, mut cancel_rx) = tokio::sync::watch::channel(false);

    let handle = app.clone();

    let listener: u32 = handle.listen_any("app_close", move |_| {
        cancel_tx
            .send(true)
            .expect("Should have been able to cancel subscriptions.");
    });

    tauri::async_runtime::spawn(async move {
        let config = get_app_config(&db).await.map_err(to_app_err)?;

        let deployment_url = "https://graceful-ox-411.convex.cloud";

        let mut client = match ConvexClient::new(deployment_url).await {
            Ok(c) => c,
            Err(e) => {
                let err_ctx = e
                    .context(format!("Failed to connect: {}", deployment_url))
                    .to_string();

                thread_shutdown_tx.send(AppError::Convex(err_ctx)).ok();
                panic!("Unable to establish a convex client instance.")
            }
        };

        let fn_path = "fns:get_recent_pastes";

        let recent_pastes = client.subscribe(
            fn_path,
            maplit::btreemap! {
                "app_id".to_string() => config.app_id.into()
            },
        );

        let mut recent_pastes_subscription = match recent_pastes.await {
            Ok(s) => s,
            Err(e) => {
                let err_ctx = e
                    .context(format!("Failed to subscribe: '{}'", fn_path))
                    .to_string();

                thread_shutdown_tx.send(AppError::Convex(err_ctx)).ok();
                panic!("Unable to subscribe to recent_pastes_subscription query.")
            }
        };

        loop {
            tokio::select! {
                result = recent_pastes_subscription.next() => {
                    let Some(result) = result else {
                        break;
                    };

                    match result {
                        FunctionResult::Value(x) => {
                            let json_value = x.export();

                            let history: Vec<RemotePasteBinHistory> =
                                serde_json::from_value(json_value)?;

                            handle
                                .emit_to(EventTarget::any(), "get_value", history)
                                .context("failed to emit value for convex subscription")
                                .map_err(to_app_err)?;
                        }
                        FunctionResult::ConvexError(err) => {
                            handle
                                .emit_to(EventTarget::any(), "convex_error", err.to_string())
                                .context(format!("Convex error: {}", err))
                                .expect("could not emit convex_error");
                        }
                        FunctionResult::ErrorMessage(err_msg) => {
                            println!("Error message: {}", err_msg);
                            handle
                                .emit_to(EventTarget::any(), "error_message", &err_msg)
                                .context(format!("Error message: {}", err_msg))
                                .expect("could not emit convex error_message");
                        }
                    }
                }

                _ = cancel_rx.changed() => {
                    println!("Detaching event listeners.");
                    handle.unlisten(listener);
                    break;
                }
            }
        }

        Ok::<(), AppError>(())
    });

    Ok(())
}
