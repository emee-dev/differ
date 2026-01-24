use crate::config::get_app_config;
use crate::prelude::*;
use crate::utils::Utils;
use aisdk::core::LanguageModelRequest;
use aisdk::core::{Message, StreamTextResponse};
use aisdk::integrations::{axum::AxumSseResponse, vercel_aisdk_ui::VercelUIRequest};
use aisdk::providers::google::{
    Gemini20Flash, Gemini25Flash, Gemini25FlashLite, Gemini25FlashLitePreview0617, Gemini25Pro,
    Gemini3ProPreview, Google,
};
use aisdk::providers::groq::{Groq, Llama318bInstant};
use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};
use std::net::SocketAddr;
use tauri::AppHandle;
use tauri::Listener;
use tauri::Manager;
use tokio::sync::watch::Sender;
use tower_http::cors::CorsLayer;

#[axum::debug_handler]
async fn chat_handler(
    State(db): State<Db>,
    Json(request): Json<VercelUIRequest>,
) -> AxumSseResponse {
    let config = get_app_config(&db)
        .await
        .expect("Should have been able to query db.");

    let provider = config.selected_provider.trim();

    let api_key = match provider {
        "google" => config.google_key.unwrap_or_default(),
        "anthropic" => config.anthropic_key.unwrap_or_default(),
        "groq" => config.groq_key.unwrap_or_default(),
        "openai" => config.openai_key.unwrap_or_default(),
        _ => "".to_string(),
    };

    let api_key = api_key.trim();
    let model = config.selected_model.trim();

    let messages: Vec<Message> = request.into();

    let model = get_provider_model(provider, model, api_key).unwrap();

    let response = get_model_messages(messages, model).await.unwrap();

    response.into()
}

pub fn init_chat_api(
    app: AppHandle,
    db: Db,
    thread_shutdown_tx: Sender<AppError>,
) -> AppResult<()> {
    let (cancel_tx, mut cancel_rx) = tokio::sync::watch::channel(false);

    let app_handle = app.clone();
    let app_state = app.state::<AppState>();

    let mut app_state = app_state
        .lock()
        .expect("Unable to obtain lock to app state.");

    let addr = SocketAddr::from(([127, 0, 0, 1], Utils::get_random_port()));

    app_state.chat_api_endpoint = Some(format!("http://{}", addr));

    let listener: u32 = app_handle.listen_any("app_close", move |_| {
        println!("Terminating thread...");
        cancel_tx
            .send(true)
            .expect("Should have been able to cancel chat_api.");
    });

    tauri::async_runtime::spawn(async move {
        let app = Router::new()
            .route("/api/chat", post(chat_handler))
            .with_state(db.clone())
            .layer(CorsLayer::permissive());

        let tcp_listener = tokio::net::TcpListener::bind(addr).await;

        let tcp_listener = match tcp_listener {
            Ok(tcp) => tcp,
            Err(err) => {
                thread_shutdown_tx
                    .send(AppError::ChatAPI(err.to_string()))
                    .ok();
                panic!("Failed to bind tcp listener for port: {}", addr)
            }
        };

        let shutdown_signal = async move {
            let _ = cancel_rx.changed().await;

            app_handle.unlisten(listener);
            println!("Chat api has been terminated.");
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

    // FALLBACK
    Unsupported(String),
}
