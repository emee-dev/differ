use anyhow::{Context, Result};
use convex::{ConvexClient, FunctionResult};
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::Listener;
use tauri::{self, AppHandle, Emitter, EventTarget};

use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RemotePasteBinHistory {
    #[serde(rename = "_creationTime")]
    pub creation_time: f64,

    #[serde(rename = "_id")]
    pub uuid: String,

    #[serde(rename = "accountId")]
    pub account_id: String,

    pub body: String,
    pub date: String,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalPasteBinHistory {
    #[serde(rename = "_creationTime")]
    pub creation_time: f64,

    #[serde(rename = "_id")]
    pub uuid: String,

    #[serde(rename = "accountId")]
    pub account_id: String,

    pub body: String,
    pub date: String,
    pub id: String,

    // flag
    #[serde(rename = "isLocal")]
    pub is_local: bool,
}

pub fn init_queries(app: AppHandle) -> Result<(), AppError> {
    let (cancel_tx, mut cancel_rx) = tokio::sync::watch::channel(false);

    let handle = app.clone();

    let listener: u32 = handle.listen_any("app_close", move |_| {
        println!("Terminating thread...");
        cancel_tx
            .send(true)
            .expect("Should have been able to cancel subscriptions.");
    });

    tauri::async_runtime::spawn(async move {
        let deployment_url = "https://graceful-ox-411.convex.cloud";

        let mut client = ConvexClient::new(deployment_url)
            .await
            .expect("Should have been a valid client");

        let mut sub: convex::QuerySubscription = client
            .subscribe("fns:getPasteBins", maplit::btreemap! {})
            .await
            .context(format!("Failed to subscribe to: '{}'", "fns:getPasteBins"))
            .expect("Failed to initialize a convex subscription.");

        loop {
            tokio::select! {
                result = sub.next() => {
                    let Some(result) = result else {
                        break;
                    };

                    match result {
                        FunctionResult::Value(x) => {
                            let json_value = x.export();

                            println!("Json value: {}", json_value);

                            let history: Vec<RemotePasteBinHistory> =
                                serde_json::from_value(json_value)
                                    .expect("should have been able to deserialize pastebin data");

                            handle
                                .emit_to(EventTarget::any(), "get_value", history)
                                .expect("could not emit value");

                        }
                        FunctionResult::ConvexError(err) => {
                            println!("Convex error: {}", err);
                            handle
                                .emit_to(EventTarget::any(), "convex_error", err.to_string())
                                .expect("could not emit convex_error");
                        }
                        FunctionResult::ErrorMessage(err_msg) => {
                            println!("Error message: {}", err_msg);
                            handle
                                .emit_to(EventTarget::any(), "error_message", err_msg)
                                .expect("could not emit error_message");
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

        Ok::<_, String>(())
    });

    Ok(())
}
