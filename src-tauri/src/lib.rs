mod commands;
mod convex_query;
mod error;
mod utils;

use crate::convex_query::init_queries;
use commands::read_file;
use std::env;
use tauri::{self, Emitter};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command(rename_all = "snake_case")]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> anyhow::Result<()> {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            // init_queries(handle)?;

            Ok(())
        })
        .on_window_event(|window, ev| {
            match ev {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Prevent default
                    api.prevent_close();

                    window
                        .emit("app_close", None::<bool>)
                        .expect("should have ended the convex subscription.");

                    println!("Window close requested! Hiding window instead of closing.");

                    window.destroy().expect("should have closed the window.");
                    ()
                }

                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![greet, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
