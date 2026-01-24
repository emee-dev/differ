use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug, Clone)]
pub enum AppError {
    #[error("Runtime error: {0}")]
    Runtime(String),

    #[error("Subscription error: {0}")]
    Subscription(String),

    #[error("Database connection failed")]
    DbConnection,

    #[error("Database operation failed")]
    DbOperation,

    #[error("Record not found")]
    NotFound,

    #[error("File error: {0}")]
    File(String),

    #[error("Parse error: {0}")]
    JsonParse(String),

    #[error("Thread failed: {0}")]
    ChatAPI(String),

    #[error("Thread failed: {0}")]
    Convex(String),

    #[error("There is no error at the moment")]
    InitialServiceState,

    #[error("Unknown error")]
    Unknown,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(value: serde_json::Error) -> Self {
        AppError::JsonParse(value.to_string())
    }
}

impl From<convex::ConvexError> for AppError {
    fn from(value: convex::ConvexError) -> Self {
        AppError::Subscription(value.message)
    }
}

impl From<tauri::Error> for AppError {
    fn from(value: tauri::Error) -> Self {
        AppError::Runtime(value.to_string())
    }
}
