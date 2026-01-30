use axum::response::{IntoResponse, Response};
use reqwest::StatusCode;
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
    Convex(String),

    #[error("Request error: {0}")]
    Request(String),

    #[error("AI chat error: {0}")]
    AIChat(String),

    #[error("AI chat error: {0}")]
    UnsupportedProvider(String),

    #[error("Missing apikey: {0}")]
    MissingApiKey(String),

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

impl From<aisdk::Error> for AppError {
    fn from(value: aisdk::Error) -> Self {
        AppError::AIChat(value.to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let body = match self {
            AppError::AIChat(msg) => msg,
            AppError::MissingApiKey(msg) => msg,
            AppError::UnsupportedProvider(msg) => msg,
            AppError::Unknown => "Internal error, failed to process request.".to_string(),
            _ => "Internal error, please try again later.".to_string(),
        };

        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}
