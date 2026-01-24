use crate::config::{get_app_config, update_app_config, AppConfigRecord, UpdateAppConfig};
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
    let db = &state.db;

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

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct FileContents {
    pub name: String,
    pub contents: String,
}
