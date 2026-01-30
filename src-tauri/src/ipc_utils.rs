use crate::db_config::{get_app_config, update_app_config, AppConfigRecord, UpdateAppConfig};
use crate::prelude::*;
use crate::utils::Utils;
use std::{fs, path::Path};
use tauri::Manager;
use tauri::{AppHandle, Runtime};

#[tauri::command(rename_all = "snake_case")]
pub fn cmd_read_file(file_path: &str) -> anyhow::Result<FileContents, AppError> {
    let normalized_path = Utils::normalise_path(file_path);
    let p = Path::new(normalized_path.as_str());

    let name = p
        .file_name()
        .unwrap_or_default()
        .to_str()
        .unwrap_or_default()
        .to_string();

    let contents = fs::read_to_string(normalized_path)
        .context(format!("Could not read: {}", file_path))
        .map_err(|e| AppError::File(e.to_string()))?;

    Ok(FileContents { name, contents })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_get_app_config<R: Runtime>(
    app: AppHandle<R>,
) -> anyhow::Result<AppConfigRecord, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = state.db.clone();

    let config = get_app_config(db).await.map_err(to_app_err)?;

    Ok(config)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_update_app_config<R: Runtime>(
    app: AppHandle<R>,
    config: UpdateAppConfig,
) -> anyhow::Result<bool, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let operation = update_app_config(db, config).await.map_err(to_app_err)?;

    let result = operation.rows_affected() == 1;

    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_query_convex_task_status(app: AppHandle) -> anyhow::Result<TaskStatus, AppError> {
    let mutx_state = app.state::<AppState>();

    let mutx = mutx_state.lock().await;

    let task_status = mutx.convex_task_status.clone();

    Ok(task_status)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_get_all_tasks(app: AppHandle) -> anyhow::Result<Vec<Tasks>, AppError> {
    let mutx_state = app.state::<AppState>();

    let mut tasks: Vec<Tasks> = vec![];

    let mutx = mutx_state.lock().await;

    tasks.push(Tasks {
        id: "convex_subscription".into(),
        status: mutx.convex_task_status.clone(),
    });

    tasks.push(Tasks {
        id: "chat_api".into(),
        status: mutx.chat_api_task_status.clone(),
    });

    Ok(tasks)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_open_url(url: &str) -> anyhow::Result<(), AppError> {
    let d = url.to_string();

    tauri::async_runtime::spawn(async move {
        webbrowser::open(d.as_str()).map_err(|_| AppError::Unknown)?;
        Ok::<(), AppError>(())
    });

    Ok(())
}
#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct Tasks {
    id: String,
    status: TaskStatus,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct FileContents {
    pub name: String,
    pub contents: String,
}
