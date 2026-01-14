use convex::ConvexError;
use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error(transparent)]
    SubscriptionError(#[from] ConvexError),

    // #[error("Url error: {0}")]
    // UrlParseError(#[from] ParseError),

    // #[error("Invalid request: {0}")]
    // RequestError(String),
    #[error("Unknown error")]
    Unknown,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
