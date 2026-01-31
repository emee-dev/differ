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

#[derive(sqlx::FromRow, Default, Serialize, Deserialize, Clone)]
pub struct ChatsRecord {
    pub id: String,
    pub label: String,
    pub messages: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;

    async fn setup_db() -> SqlitePool {
        let pool = SqlitePool::connect(":memory:")
            .await
            .expect("failed to create sqlite pool");

        match sqlx::migrate!("./migrations").run(&pool).await {
            Ok(_) => (),
            Err(migration_error) => panic!("Database migration error: {:?}", migration_error),
        }

        pool
    }

    fn mock_chat() -> ChatsRecord {
        ChatsRecord {
            id: "chat_1".to_string(),
            label: "Test Chat".to_string(),
            messages: "[]".to_string(),
        }
    }

    #[tokio::test]
    async fn test_create_chat() {
        let db = setup_db().await;
        let chat = mock_chat();

        let result = create_chat(&db, chat).await;
        assert!(result.is_ok());

        let rows_affected = result.unwrap().rows_affected();
        assert_eq!(rows_affected, 1);
    }

    #[tokio::test]
    async fn test_findone_by_id() {
        let db = setup_db().await;
        let chat = mock_chat();

        create_chat(&db, chat.clone())
            .await
            .expect("failed to create chat");

        let fetched = findone_by_id(&db, &chat.id)
            .await
            .expect("failed to fetch chat");

        assert_eq!(fetched.id, chat.id);
        assert_eq!(fetched.label, chat.label);
        assert_eq!(fetched.messages, chat.messages);
    }
}
