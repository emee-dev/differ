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

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;

    async fn setup_db() -> SqlitePool {
        let pool = SqlitePool::connect(":memory:")
            .await
            .expect("failed to create in-memory sqlite pool");

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("failed to run database migrations");

        pool
    }

    fn mock_paste(id: &str) -> PasteRecord {
        PasteRecord {
            id: id.to_string(),
            body: "Hello world".to_string(),
            attachments: vec![AttachmentRecord {
                original_file_name: "file.txt".to_string(),
                original_file_size: "12kb".to_string(),
                path_on_disk: "/tmp/file.txt".to_string(),
            }],
            created_at: "2026-01-31 12:00:00".to_string(),
            updated_at: "2026-01-31 12:00:00".to_string(),
        }
    }

    #[tokio::test]
    async fn test_create_paste() {
        let db = setup_db().await;
        let paste = mock_paste("paste_1");

        let res = create_paste(&db, paste)
            .await
            .expect("failed to create paste record");

        assert_eq!(res.rows_affected(), 1);
    }

    #[tokio::test]
    async fn test_findone_by_id() {
        let db = setup_db().await;
        let paste = mock_paste("paste_2");

        create_paste(&db, paste.clone())
            .await
            .expect("failed to create paste record for findone_by_id test");

        let fetched = findone_by_id(&db, "paste_2")
            .await
            .expect("failed to fetch paste record by id");

        assert_eq!(fetched.id, paste.id);
        assert_eq!(fetched.body, paste.body);
        assert_eq!(fetched.attachments.len(), 1);
        assert_eq!(fetched.attachments[0].original_file_name, "file.txt");
    }

    #[tokio::test]
    async fn test_find_many() {
        let db = setup_db().await;

        for i in 0..3 {
            let id = format!("paste_{}", i);
            create_paste(&db, mock_paste(&id))
                .await
                .expect("failed to create paste record for find_many test");
        }

        let list = find_many(&db).await.expect("failed to fetch paste list");

        assert_eq!(list.len(), 3);
    }

    #[tokio::test]
    async fn test_delete_paste_by_id() {
        let db = setup_db().await;
        let paste = mock_paste("paste_delete");

        create_paste(&db, paste)
            .await
            .expect("failed to create paste record for delete test");

        let res = delete_paste_by_id(&db, "paste_delete")
            .await
            .expect("failed to delete paste record by id");

        assert_eq!(res.rows_affected(), 1);

        let err = findone_by_id(&db, "paste_delete").await;
        assert!(err.is_err(), "expected error when fetching deleted paste");
    }
}
