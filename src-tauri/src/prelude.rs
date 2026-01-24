pub use crate::error::AppError;
pub use anyhow::Context;
use sqlx::{Pool, Sqlite};
use std::sync::Mutex;

pub type AppResult<T> = anyhow::Result<T>;

pub type Db = Pool<Sqlite>;

pub struct DbOnlyState {
    pub db: Db,
}

pub struct DifferState {
    pub db: Db,
    pub chat_api_endpoint: Option<String>,
}

/// Application state shared across the app.
///
/// This state is **already protected by a `Mutex`**.
/// Do **not** wrap it in another `Mutex`.
pub type AppState = Mutex<DifferState>;

pub fn to_app_err(err: anyhow::Error) -> AppError {
    if let Some(sqlx_err) = err.downcast_ref::<sqlx::Error>() {
        return match sqlx_err {
            sqlx::Error::RowNotFound => AppError::NotFound,
            sqlx::Error::Database(_) => AppError::DbOperation,
            sqlx::Error::PoolTimedOut => AppError::DbConnection,
            _ => AppError::DbOperation,
        };
    }

    if let Some(t) = err.downcast_ref::<tauri::Error>() {
        return match t {
            tauri::Error::Runtime(s) => AppError::Runtime(s.to_string()),
            _ => AppError::Unknown,
        };
    }

    AppError::Unknown
}
