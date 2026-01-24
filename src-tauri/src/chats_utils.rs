use crate::prelude::*;
use crate::utils::Utils;
use crate::Db;

use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqliteQueryResult;

pub async fn findone_by_id(db: &Db, chat_id: &str) -> AppResult<ChatsRecord> {
    let chat = sqlx::query_as::<_, ChatsRecord>("SELECT * FROM chats WHERE id = ?1 LIMIT 1")
        .bind(chat_id)
        .fetch_one(db)
        .await?;

    Ok(chat)
}

pub async fn create_chat(db: &Db, chat: ChatsRecord) -> AppResult<SqliteQueryResult> {
    let created_at = Utils::get_timestamp();
    let updated_at = Utils::get_timestamp();

    let result = sqlx::query("INSERT INTO chats (id, label, messages, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)")
        .bind(chat.id)
        .bind(chat.label)
        .bind(chat.messages)
        .bind(created_at)
        .bind(updated_at)
        .execute(db)
        .await?;

    Ok(result)
}

pub async fn find_many(db: &Db) -> AppResult<Vec<ChatsRecord>> {
    let latest_workspaces =
        sqlx::query_as::<_, ChatsRecord>("SELECT * FROM chats ORDER BY updated_at DESC LIMIT 30;")
            .fetch(db)
            .try_collect()
            .await?;

    Ok(latest_workspaces)
}

pub async fn update_chat_message(
    db: &Db,
    chat_id: &str,
    messages: &str,
) -> AppResult<SqliteQueryResult> {
    let update_chat = sqlx::query("UPDATE chats SET messages = ?1 WHERE id = ?2")
        .bind(messages)
        .bind(chat_id)
        .execute(db)
        .await?;

    Ok(update_chat)
}

pub async fn delete_chat_by_id(db: &Db, chat_id: &str) -> AppResult<SqliteQueryResult> {
    let update_chat = sqlx::query("DELETE FROM chats WHERE id = ?1")
        .bind(chat_id)
        .execute(db)
        .await?;

    Ok(update_chat)
}

#[derive(sqlx::FromRow, Default, Serialize, Deserialize)]
pub struct ChatsRecord {
    pub id: String,
    pub label: String,
    pub messages: String,
}
