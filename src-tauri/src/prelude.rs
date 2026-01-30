pub use crate::error::AppError;
pub use anyhow::Context;
use convex::ConvexClient;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};
use tokio::sync::Mutex;

pub type AppResult<T> = anyhow::Result<T>;

pub type Db = Pool<Sqlite>;

pub struct DbOnlyState {
    pub db: Db,
    pub convex_client: ConvexClient,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum TaskStatus {
    /// When called by the UI to start the thread
    Start,

    /// When initialized in Tauri managed state
    Initialized,

    /// When the thread is actively running
    Operational,

    /// When the thread is actively running and has a valid endpoint
    Endpoint { url: String },

    /// When there is an error and the thread panicked
    Panicked { error: String },
}

#[derive(Clone)]
pub struct DifferState {
    pub convex_task_status: TaskStatus,
    pub chat_api_task_status: TaskStatus,
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

    if let Some(t) = err.downcast_ref::<tauri::Error>() {
        return match t {
            tauri::Error::Runtime(s) => AppError::Runtime(s.to_string()),
            _ => AppError::Unknown,
        };
    }

    AppError::Unknown
}
