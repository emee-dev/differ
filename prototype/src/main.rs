mod error;

use aisdk::core::LanguageModelRequest;
use aisdk::core::{Message, StreamTextResponse};
use aisdk::integrations::vercel_aisdk_ui::VercelUIMessage;
use aisdk::integrations::{axum::AxumSseResponse, vercel_aisdk_ui::VercelUIRequest};
use aisdk::providers::google::Gemini15Flash8b;
use aisdk::providers::google::{
    Gemini15Flash, Gemini15Pro, Gemini20Flash, Gemini25Flash, Gemini25FlashLite,
    Gemini25FlashLitePreview0617, Gemini25Pro, Gemini3ProPreview, Google,
};
use aisdk::providers::groq::{Groq, Llama318bInstant};
use axum::routing::post;
use axum::Router;
use std::net::SocketAddr;
use std::path::Path;
use tower_http::cors::CorsLayer;

use port_selector::{random_free_tcp_port, Port};

enum Models {
    // GOOGLE — GEMINI 3
    Gemini3ProPreview(Google<Gemini3ProPreview>),

    // GOOGLE — GEMINI 2.5
    Gemini25Pro(Google<Gemini25Pro>),
    Gemini25Flash(Google<Gemini25Flash>),
    Gemini25FlashLite(Google<Gemini25FlashLite>),
    Gemini25FlashLitePreview0617(Google<Gemini25FlashLitePreview0617>),

    // GOOGLE — GEMINI 2.0
    Gemini20Flash(Google<Gemini20Flash>),

    // GOOGLE — GEMINI 1.5
    Gemini15Pro(Google<Gemini15Pro>),
    Gemini15Flash(Google<Gemini15Flash>),
    Gemini15Flash8b(Google<Gemini15Flash8b>),

    // GROQ
    GroqLlama318bInstant(Groq<Llama318bInstant>),

    // FALLBACK
    Unsupported(String),
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let path = Path::new("../.env.local");

    dotenvy::from_path(path).ok();
    dotenvy::dotenv().ok();

    let addr = SocketAddr::from(([127, 0, 0, 1], get_random_port()));
    println!("Listening on http://{}", addr);

    let app = Router::new()
        .route("/api/chat", post(chat_handler))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Should have been able to bind address");
    axum::serve(listener, app)
        .await
        .expect("should have been able to start serving http requests.");

    Ok(())
}

fn get_random_port() -> Port {
    random_free_tcp_port().unwrap_or(8080)
}

#[axum::debug_handler]
async fn chat_handler(axum::Json(request): axum::Json<UiMessage>) -> AxumSseResponse {
    let provider = "google".to_string();
    let model_id = "gemini-2.5-flash".to_string();
    let api_key = "AIzaSyCdVP6m-LiaND33yuXtbleosbFF6xplUSo".to_string();

    let vercel_ui_request: VercelUIRequest = request.into();
    let messages: Vec<Message> = vercel_ui_request.into();

    let model = get_provider_model(provider.as_str(), model_id.as_str(), api_key.as_str()).unwrap();

    let response = get_model_messages(messages, model).await.unwrap();

    // response.into()
    response
        .to_axum_vercel_ui_stream()
        .send_reasoning() // Enable reasoning chunks
        .send_start() // Include start signals
        .send_finish() // Include finish signals
        .build()
}

fn get_provider_model(provider: &str, model: &str, api_key: &str) -> anyhow::Result<Models> {
    let google_base_url = "https://generativelanguage.googleapis.com";
    let google_provider_name = "Google";

    match (provider, model) {
        // GOOGLE — GEMINI 3
        ("google", "gemini-3-pro-preview") => {
            let m = Google::<Gemini3ProPreview>::builder()
                .api_key(api_key)
                .base_url(google_base_url)
                .provider_name(google_provider_name)
                .build()?;

            Ok(Models::Gemini3ProPreview(m))
        }

        // GOOGLE — GEMINI 2.5
        ("google", "gemini-2.5-pro") => {
            let m = Google::<Gemini25Pro>::builder()
                .api_key(api_key)
                .base_url(google_base_url)
                .provider_name(google_provider_name)
                .build()?;

            Ok(Models::Gemini25Pro(m))
        }

        ("google", "gemini-2.5-flash") => {
            let m = Google::<Gemini25Flash>::builder()
                .api_key(api_key)
                .base_url(google_base_url)
                .provider_name(google_provider_name)
                .build()?;

            Ok(Models::Gemini25Flash(m))
        }

        ("google", "gemini-2.5-flash-lite") => {
            let m = Google::<Gemini25FlashLite>::builder()
                .api_key(api_key)
                .base_url(google_base_url)
                .provider_name(google_provider_name)
                .build()?;

            Ok(Models::Gemini25FlashLite(m))
        }

        ("google", "gemini-2.5-flash-lite-preview-06-17") => {
            let m = Google::<Gemini25FlashLitePreview0617>::builder()
                .api_key(api_key)
                .base_url(google_base_url)
                .provider_name(google_provider_name)
                .build()?;

            Ok(Models::Gemini25FlashLitePreview0617(m))
        }

        // GOOGLE — GEMINI 2.0
        ("google", "gemini-2.0-flash") => {
            let m = Google::<Gemini20Flash>::builder()
                .api_key(api_key)
                .base_url(google_base_url)
                .provider_name(google_provider_name)
                .build()?;

            Ok(Models::Gemini20Flash(m))
        }

        ("google", "gemini-1.5-pro") => {
            let m = Google::<Gemini15Pro>::builder()
                .api_key(api_key)
                .base_url(google_base_url)
                .provider_name(google_provider_name)
                .build()?;

            Ok(Models::Gemini15Pro(m))
        }

        ("google", "gemini-1.5-flash") => {
            let m = Google::<Gemini15Flash>::builder()
                .api_key(api_key)
                .base_url(google_base_url)
                .provider_name(google_provider_name)
                .build()?;

            Ok(Models::Gemini15Flash(m))
        }

        ("google", "gemini-1.5-flash-8b") => {
            let m = Google::<Gemini15Flash8b>::builder()
                .api_key(api_key)
                .base_url(google_base_url)
                .provider_name(google_provider_name)
                .build()?;

            Ok(Models::Gemini15Flash8b(m))
        }

        ("groq", "llama-3.1-8b-instant") => {
            let m = Groq::<Llama318bInstant>::builder()
                .api_key(api_key)
                .build()?;

            Ok(Models::GroqLlama318bInstant(m))
        }

        _ => Ok(Models::Unsupported(format!(
            "Model `{}` with provider `{}` is not supported",
            model, provider
        ))),
    }
}

async fn get_model_messages(
    messages: Vec<Message>,
    model: Models,
) -> anyhow::Result<StreamTextResponse> {
    match model {
        Models::Gemini3ProPreview(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::Gemini25Pro(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::Gemini25Flash(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::Gemini25FlashLite(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::Gemini25FlashLitePreview0617(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::Gemini20Flash(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::Gemini15Pro(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::Gemini15Flash(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::Gemini15Flash8b(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::GroqLlama318bInstant(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }

        Models::Unsupported(msg) => panic!("{msg}"),
    }
}

#[derive(serde::Deserialize)]
struct UiMessage {
    pub id: String,
    pub messages: Vec<VercelUIMessage>,
    pub trigger: String,
}

impl From<UiMessage> for VercelUIRequest {
    fn from(value: UiMessage) -> Self {
        Self {
            id: value.id,
            messages: value.messages,
            trigger: value.trigger,
        }
    }
}
