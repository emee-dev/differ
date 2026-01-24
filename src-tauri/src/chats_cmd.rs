use crate::chats_utils::{
    create_chat, delete_chat_by_id, find_many, findone_by_id, update_chat_message, ChatsRecord,
};
use crate::prelude::*;
use tauri::Manager;
use tauri::{AppHandle, Runtime};

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_get_chat_api_endpoint<R: Runtime>(
    app: AppHandle<R>,
) -> anyhow::Result<String, AppError> {
    let app_state = app.state::<AppState>();
    let state = app_state.lock().unwrap();

    let endpoint = state.chat_api_endpoint.clone().unwrap_or("".into());

    Ok(endpoint)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_save_initial_chat<R: Runtime>(
    app: AppHandle<R>,
    chat: ChatsRecord,
) -> anyhow::Result<bool, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let query = create_chat(db, chat).await.map_err(to_app_err)?;

    let result = query.rows_affected() == 1;

    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_get_chat_by_id<R: Runtime>(
    app: AppHandle<R>,
    chat_id: &str,
) -> anyhow::Result<ChatsRecord, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let query = findone_by_id(db, chat_id).await.map_err(to_app_err)?;

    Ok(query)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_update_chat_message<R: Runtime>(
    app: AppHandle<R>,
    chat_id: &str,
    messages: &str,
) -> anyhow::Result<bool, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let operation = update_chat_message(db, chat_id, messages)
        .await
        .map_err(to_app_err)?;

    let result = operation.rows_affected() == 1;

    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_find_recent_chats<R: Runtime>(
    app: AppHandle<R>,
) -> anyhow::Result<Vec<ChatsRecord>, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let result = find_many(db).await.map_err(to_app_err)?;

    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_delete_chat_by_id<R: Runtime>(
    app: AppHandle<R>,
    chat_id: &str,
) -> anyhow::Result<bool, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let operation = delete_chat_by_id(db, chat_id).await.map_err(to_app_err)?;

    let result = operation.rows_affected() == 1;
    Ok(result)
}
