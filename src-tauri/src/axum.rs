use crate::constants::{
    ANTHROPIC_BASE_URL, ANTHROPIC_PROVIDER_NAME, GOOGLE_BASE_URL, GOOGLE_PROVIDER_NAME,
    GROQ_BASE_URL, GROQ_PROVIDER_NAME, OPENAI_BASE_URL, OPENAI_PROVIDER_NAME,
};
use crate::db_config::get_app_config;
use crate::prelude::*;
use crate::utils::Utils;
use aisdk::core::LanguageModelRequest;
use aisdk::core::{Message, StreamTextResponse};
use aisdk::integrations::{axum::AxumSseResponse, vercel_aisdk_ui::VercelUIRequest};
use aisdk::providers::anthropic::{
    Anthropic, ClaudeHaiku45, ClaudeOpus41, ClaudeOpus45, ClaudeSonnet45,
};
use aisdk::providers::google::{
    Gemini20Flash, Gemini25Flash, Gemini25FlashLite, Gemini25FlashLitePreview0617, Gemini25Pro,
    Gemini3ProPreview, Google,
};
use aisdk::providers::groq::{Groq, Llama318bInstant};
use aisdk::providers::openai::{Gpt51Codex, Gpt52, Gpt52ChatLatest, Gpt52Pro, OpenAI};
use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};
use std::net::SocketAddr;
use tauri::AppHandle;
use tauri::Listener;
use tauri::Manager;
use tower_http::cors::CorsLayer;

#[axum::debug_handler]
async fn chat_handler(
    State(db): State<Db>,
    Json(request): Json<VercelUIRequest>,
) -> Result<AxumSseResponse, AppError> {
    let config = get_app_config(db).await.map_err(to_app_err)?;

    let provider = config.selected_provider.trim();

    let api_key = match provider {
        "google" => config.google_key.as_deref(),
        "anthropic" => config.anthropic_key.as_deref(),
        "groq" => config.groq_key.as_deref(),
        "openai" => config.openai_key.as_deref(),
        _ => None,
    }
    .ok_or(AppError::UnsupportedProvider(provider.to_string()))?
    .trim();

    if api_key.is_empty() {
        return Err(AppError::MissingApiKey(provider.to_string()));
    }

    let model = config.selected_model.trim();

    let messages: Vec<Message> = request.into();

    let model = get_provider_model(provider, model, api_key)?;

    let response = get_model_messages(messages, model).await?;

    Ok(response.into())
}

async fn not_found_handler() -> &'static str {
    "The requested endpoint does not exist. Please check the URL and HTTP method."
}

pub fn init_chat_api(app: &AppHandle, db: Db) -> AppResult<()> {
    let (cancel_tx, mut cancel_rx) = tokio::sync::watch::channel(false);

    let app = app.clone();
    let app_handle = app.clone();
    let addr = SocketAddr::from(([127, 0, 0, 1], Utils::get_random_port()));

    let app_close: u32 = app_handle.listen_any("app_close", move |_| {
        cancel_tx.send(true).ok();
    });

    tauri::async_runtime::spawn(async move {
        let app_state = app.state::<AppState>();

        // Drop mutex
        {
            let mut app_state = app_state.lock().await;
            app_state.chat_api_task_status = TaskStatus::Endpoint {
                url: format!("http://{}", addr),
            };
        }

        let app = Router::new()
            .route("/api/chat", post(chat_handler))
            .with_state(db.clone())
            .fallback(not_found_handler)
            .layer(CorsLayer::permissive());

        let tcp_listener = tokio::net::TcpListener::bind(addr).await;

        let tcp_listener = match tcp_listener {
            Ok(tcp) => tcp,
            Err(err) => {
                let mut app_state = app_state.lock().await;
                let message = format!("Failed to start server on {}: {}", addr, err);

                app_state.chat_api_task_status = TaskStatus::Panicked {
                    error: message.clone(),
                };

                panic!("{}", message);
            }
        };

        let shutdown_signal = async move {
            let _ = cancel_rx.changed().await;

            app_handle.unlisten(app_close);
            println!("Axum server has been terminated.");
        };

        let server = axum::serve(tcp_listener, app).with_graceful_shutdown(shutdown_signal);

        tokio::select! {
            result = server => {
                if let Err(err) = result {
                    println!("Server error: {}", err);
                }
            }
        }

        Ok::<_, String>(())
    });

    Ok(())
}

fn get_provider_model(
    provider: &str,
    model: &str,
    api_key: &str,
) -> anyhow::Result<Models, AppError> {
    match (provider, model) {
        // GOOGLE — GEMINI 3
        ("google", "gemini-3-pro-preview") => {
            let m = Google::<Gemini3ProPreview>::builder()
                .api_key(api_key)
                .base_url(GOOGLE_BASE_URL)
                .provider_name(GOOGLE_PROVIDER_NAME)
                .build()?;

            Ok(Models::Gemini3ProPreview(m))
        }

        // GOOGLE — GEMINI 2.5
        ("google", "gemini-2.5-pro") => {
            let m = Google::<Gemini25Pro>::builder()
                .api_key(api_key)
                .base_url(GOOGLE_BASE_URL)
                .provider_name(GOOGLE_PROVIDER_NAME)
                .build()?;

            Ok(Models::Gemini25Pro(m))
        }

        ("google", "gemini-2.5-flash") => {
            let m = Google::<Gemini25Flash>::builder()
                .api_key(api_key)
                .base_url(GOOGLE_BASE_URL)
                .provider_name(GOOGLE_PROVIDER_NAME)
                .build()?;

            Ok(Models::Gemini25Flash(m))
        }

        ("google", "gemini-2.5-flash-lite") => {
            let m = Google::<Gemini25FlashLite>::builder()
                .api_key(api_key)
                .base_url(GOOGLE_BASE_URL)
                .provider_name(GOOGLE_PROVIDER_NAME)
                .build()?;

            Ok(Models::Gemini25FlashLite(m))
        }

        ("google", "gemini-2.5-flash-lite-preview-06-17") => {
            let m = Google::<Gemini25FlashLitePreview0617>::builder()
                .api_key(api_key)
                .base_url(GOOGLE_BASE_URL)
                .provider_name(GOOGLE_PROVIDER_NAME)
                .build()?;

            Ok(Models::Gemini25FlashLitePreview0617(m))
        }

        // GOOGLE — GEMINI 2.0
        ("google", "gemini-2.0-flash") => {
            let m = Google::<Gemini20Flash>::builder()
                .api_key(api_key)
                .base_url(GOOGLE_BASE_URL)
                .provider_name(GOOGLE_PROVIDER_NAME)
                .build()?;

            Ok(Models::Gemini20Flash(m))
        }

        // Groq
        ("groq", "llama-3.1-8b-instant") => {
            let m = Groq::<Llama318bInstant>::builder()
                .api_key(api_key)
                .base_url(GROQ_BASE_URL)
                .provider_name(GROQ_PROVIDER_NAME)
                .build()?;

            Ok(Models::GroqLlama318bInstant(m))
        }

        // Anthropic
        ("anthropic", "claude-opus-4-5") => {
            let m = Anthropic::<ClaudeOpus45>::builder()
                .api_key(api_key)
                .base_url(ANTHROPIC_BASE_URL)
                .provider_name(ANTHROPIC_PROVIDER_NAME)
                .build()?;

            Ok(Models::AnthropicClaudeOpus45(m))
        }
        ("anthropic", "claude-haiku-4-5") => {
            let m = Anthropic::<ClaudeHaiku45>::builder()
                .api_key(api_key)
                .base_url(ANTHROPIC_BASE_URL)
                .provider_name(ANTHROPIC_PROVIDER_NAME)
                .build()?;

            Ok(Models::AnthropicClaudeHaiku45(m))
        }
        ("anthropic", "claude-sonnet-4-5") => {
            let m = Anthropic::<ClaudeSonnet45>::builder()
                .api_key(api_key)
                .base_url(ANTHROPIC_BASE_URL)
                .provider_name(ANTHROPIC_PROVIDER_NAME)
                .build()?;

            Ok(Models::AnthropicClaudeSonnet45(m))
        }
        ("anthropic", "claude-opus-4-1") => {
            let m = Anthropic::<ClaudeOpus41>::builder()
                .api_key(api_key)
                .base_url(ANTHROPIC_BASE_URL)
                .provider_name(ANTHROPIC_PROVIDER_NAME)
                .build()?;

            Ok(Models::AnthropicClaudeOpus41(m))
        }

        // OpenAI
        ("openai", "gpt-5.2-pro") => {
            let m = OpenAI::<Gpt52Pro>::builder()
                .api_key(api_key)
                .base_url(OPENAI_BASE_URL)
                .provider_name(OPENAI_PROVIDER_NAME)
                .build()?;

            Ok(Models::OpenaiGpt52Pro(m))
        }
        ("openai", "gpt-5.2-chat-latest") => {
            let m = OpenAI::<Gpt52ChatLatest>::builder()
                .api_key(api_key)
                .base_url(OPENAI_BASE_URL)
                .provider_name(OPENAI_PROVIDER_NAME)
                .build()?;

            Ok(Models::OpenaiGpt52ChatLatest(m))
        }
        ("openai", "gpt-5.2") => {
            let m = OpenAI::<Gpt52>::builder()
                .api_key(api_key)
                .base_url(OPENAI_BASE_URL)
                .provider_name(OPENAI_PROVIDER_NAME)
                .build()?;

            Ok(Models::OpenaiGpt52(m))
        }
        ("openai", "gpt-5.1-codex") => {
            let m = OpenAI::<Gpt51Codex>::builder()
                .api_key(api_key)
                .base_url(OPENAI_BASE_URL)
                .provider_name(OPENAI_PROVIDER_NAME)
                .build()?;

            Ok(Models::OpenaiGpt51Codex(m))
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
) -> anyhow::Result<StreamTextResponse, AppError> {
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
        Models::GroqLlama318bInstant(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::AnthropicClaudeOpus45(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::AnthropicClaudeHaiku45(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::AnthropicClaudeSonnet45(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::AnthropicClaudeOpus41(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::OpenaiGpt52Pro(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::OpenaiGpt52ChatLatest(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::OpenaiGpt52(model) => {
            let request = LanguageModelRequest::builder()
                .model(model)
                .messages(messages)
                .build()
                .stream_text()
                .await?;

            Ok(request)
        }
        Models::OpenaiGpt51Codex(model) => {
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

    // GROQ
    GroqLlama318bInstant(Groq<Llama318bInstant>),

    // Anthropic
    AnthropicClaudeOpus45(Anthropic<ClaudeOpus45>),
    AnthropicClaudeHaiku45(Anthropic<ClaudeHaiku45>),
    AnthropicClaudeSonnet45(Anthropic<ClaudeSonnet45>),
    AnthropicClaudeOpus41(Anthropic<ClaudeOpus41>),

    // OpenAI
    OpenaiGpt52Pro(OpenAI<Gpt52Pro>),
    OpenaiGpt52ChatLatest(OpenAI<Gpt52ChatLatest>),
    OpenaiGpt52(OpenAI<Gpt52>),
    OpenaiGpt51Codex(OpenAI<Gpt51Codex>),

    Unsupported(String),
}
