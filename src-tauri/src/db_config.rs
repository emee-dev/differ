use crate::constants::{APP_ID_PREFIX, DEFAULT_PROVIDER_MODEL};
use crate::utils::Utils;
use crate::Db;
use crate::{constants::DEFAULT_AI_PROVIDER, prelude::*};
use anyhow::Context;
use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqliteQueryResult;

pub async fn create_app_config(db: &Db, app_id: &str) -> AppResult<SqliteQueryResult> {
    // Max no of records one.
    let record_id = "1";
    let app_id = format!("{}{}", APP_ID_PREFIX, app_id);
    let last_tab = "";
    let anthropic_key = "";
    let google_key = "";
    let groq_key = "";
    let openai_key = "";
    let selected_provider = DEFAULT_AI_PROVIDER;
    let selected_model = DEFAULT_PROVIDER_MODEL;

    let result = sqlx::query("INSERT OR IGNORE INTO app_config (id, app_id, last_tab, anthropic_key, google_key, groq_key, openai_key, selected_provider, selected_model) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)")
        .bind(record_id)
        .bind(app_id)
        .bind(last_tab)
        .bind(anthropic_key)
        .bind(google_key)
        .bind(groq_key)
        .bind(openai_key)
        .bind(selected_provider)
        .bind(selected_model)
        .execute(db)
        .await?;

    Ok(result)
}

pub async fn init_app_config(db: &Db) -> AppResult<bool> {
    let app_id = Utils::get_random_id();

    let result = create_app_config(db, app_id.as_str()).await?;

    Ok(result.rows_affected() == 1)
}

pub async fn get_app_config(db: Db) -> AppResult<AppConfigRecord> {
    let record = sqlx::query_as::<_, AppConfigRecord>("SELECT * FROM app_config LIMIT 1")
        .fetch_one(&db)
        .await
        .context("Failed to query app config")?;

    Ok(record)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAppConfig {
    pub app_id: String,
    pub last_tab: Option<String>,
    pub anthropic_key: Option<String>,
    pub google_key: Option<String>,
    pub groq_key: Option<String>,
    pub openai_key: Option<String>,
    pub selected_provider: Option<String>,
    pub selected_model: Option<String>,
}

pub async fn update_app_config(db: &Db, config: UpdateAppConfig) -> AppResult<SqliteQueryResult> {
    let record = sqlx::query(
        r#"
        UPDATE app_config
        SET
            last_tab = COALESCE(?1, last_tab),
            anthropic_key = COALESCE(?2, anthropic_key),
            google_key = COALESCE(?3, google_key),
            groq_key = COALESCE(?4, groq_key),
            openai_key = COALESCE(?5, openai_key),
            selected_provider = COALESCE(?6, selected_provider),
            selected_model = COALESCE(?7, selected_model)
        WHERE app_id = ?8
        "#,
    )
    .bind(config.last_tab)
    .bind(config.anthropic_key)
    .bind(config.google_key)
    .bind(config.groq_key)
    .bind(config.openai_key)
    .bind(config.selected_provider)
    .bind(config.selected_model)
    .bind(config.app_id)
    .execute(db)
    .await
    .context("Failed to update app config")?;

    Ok(record)
}

#[derive(sqlx::FromRow, Default, Serialize, Deserialize, Clone)]
pub struct AppConfigRecord {
    pub app_id: String,
    pub last_tab: String,
    pub anthropic_key: Option<String>,
    pub google_key: Option<String>,
    pub groq_key: Option<String>,
    pub openai_key: Option<String>,

    // State
    pub selected_provider: String,
    pub selected_model: String,
}
