use crate::prelude::*;
use crate::Db;
use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, sqlite::SqliteQueryResult};

pub async fn findone_by_id(db: &Db, paste_id: &str) -> AppResult<PasteRecord> {
    let paste = sqlx::query_as::<_, PasteRecord>("SELECT * FROM paste_bins WHERE id = ?1 LIMIT 1")
        .bind(paste_id)
        .fetch_one(db)
        .await?;

    Ok(paste)
}

pub async fn find_many(db: &Db) -> AppResult<Vec<PasteRecord>> {
    let list_recent_pastes = sqlx::query_as::<_, PasteRecord>(
        "SELECT * FROM paste_bins ORDER BY updated_at DESC LIMIT 30;",
    )
    .fetch(db)
    .try_collect()
    .await?;

    Ok(list_recent_pastes)
}

pub async fn delete_paste_by_id(db: &Db, paste_id: &str) -> AppResult<SqliteQueryResult> {
    let operation = sqlx::query("DELETE FROM paste_bins WHERE id = ?1")
        .bind(paste_id)
        .execute(db)
        .await?;

    Ok(operation)
}

pub async fn create_paste(db: &Db, paste: PasteRecord) -> AppResult<SqliteQueryResult> {
    let attachments_json = serde_json::to_string(&paste.attachments)?;

    let result = sqlx::query("INSERT INTO paste_bins (id, body, attachments, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)")
        .bind(paste.id)
        .bind(paste.body)
        .bind(attachments_json)
        .bind(paste.created_at)
        .bind(paste.updated_at)
        .execute(db)
        .await?;

    Ok(result)
}

#[derive(FromRow, Serialize, Deserialize, Clone)]
pub struct PasteRecord {
    pub id: String,
    pub body: String,
    #[sqlx(json)]
    pub attachments: Vec<AttachmentRecord>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(FromRow, Serialize, Deserialize, Clone)]
pub struct AttachmentRecord {
    pub original_file_name: String,
    pub original_file_size: String,
    pub path_on_disk: String,
}
