use crate::constants::{APP_ID, ATTACHMENTS, DB_ID};
use crate::prelude::*;
use chrono::Local;
use directories::UserDirs;
use futures_util::StreamExt;
use opentelemetry::KeyValue;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_otlp::WithTonicConfig;
use opentelemetry_sdk::trace::SdkTracerProvider;
use opentelemetry_sdk::Resource;
use port_selector::{random_free_tcp_port, Port};
use sqlx::sqlite::SqlitePoolOptions;
use std::fs::File;
use std::io::Write;
use std::io::{BufReader, Cursor};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tokio::fs;
use tokio::fs::OpenOptions;
use tonic::metadata::MetadataMap;
use tonic::transport::ClientTlsConfig;
use uuid::Uuid;

pub struct Utils;

impl Utils {
    pub fn normalise_path(dir: &str) -> String {
        let mut path = String::from(dir);

        if path.contains("\\") {
            path = path.replace("\\\\", "/").as_str().to_string();
        };

        path = path.replace("\\", "/");

        path
    }

    pub fn get_document_dir() -> Result<PathBuf, String> {
        let user_dirs =
            UserDirs::new().ok_or_else(|| "Unable to access user directories".to_string())?;

        let document_dir = user_dirs
            .document_dir()
            .ok_or_else(|| "Unable to find Documents directory".to_string())?;

        Ok(document_dir.to_path_buf())
    }

    pub fn get_random_id() -> String {
        Uuid::new_v4().to_string()
    }

    pub fn get_random_port() -> Port {
        random_free_tcp_port().unwrap_or(9595)
    }

    pub fn get_timestamp() -> String {
        let now = Local::now();
        let formatted = now.format("%Y-%m-%d %H:%M:%S").to_string();

        formatted
    }

    pub async fn setup_db() -> AppResult<Db> {
        let path_buf = Utils::get_document_dir();

        let document_dir = match path_buf {
            Ok(s) => s,
            Err(msg) => panic!("Document directory error: {}", msg),
        };

        let document_dir = document_dir.to_str().unwrap_or("");

        if document_dir.is_empty() {
            panic!("Failed to find documents");
        }

        let app_directory = format!("{}/{}", document_dir, APP_ID);

        let app_directory = Utils::normalise_path(app_directory.as_str());
        let db_directory = format!("{}/{}", app_directory, DB_ID);
        let attachments_directory = format!("{}/{}", app_directory, ATTACHMENTS);

        match fs::create_dir_all(&app_directory).await {
            Ok(_) => (),
            Err(msg) => panic!("Failed to create app directory: {:?}", msg),
        }

        match fs::create_dir_all(&attachments_directory).await {
            Ok(_) => (),
            Err(msg) => panic!("Failed to create attachments directory: {:?}", msg),
        }

        match OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&db_directory)
            .await
        {
            Ok(_) => (),
            Err(err) => match err.kind() {
                std::io::ErrorKind::AlreadyExists => (),
                _ => println!("File already exists: {:?}", err),
            },
        }

        let connection = SqlitePoolOptions::new()
            .connect(format!("sqlite:{}", db_directory).as_str())
            .await;

        let sql_pool = match connection {
            Ok(pool) => pool,
            Err(e) => panic!("Database connection error: {}", e),
        };

        match sqlx::migrate!("./migrations").run(&sql_pool).await {
            Ok(_) => (),
            Err(migration_error) => panic!("Database migration error: {:?}", migration_error),
        }

        Ok(sql_pool)
    }

    pub fn init_env_variables() {
        if cfg!(debug_assertions) {
            dotenvy::from_filename("../.env.local").ok();
        } else {
            let source = include_str!("../../.env.local");

            let cursor = Cursor::new(source.as_bytes());

            let reader = BufReader::new(cursor);

            dotenvy::from_read(reader).ok();
        };
    }

    pub async fn download_file_with_progress<T: FnMut(u64, Option<u64>)>(
        url: &str,
        path: &Path,
        mut cb: T,
    ) -> AppResult<()> {
        let resp = reqwest::get(url)
            .await
            .map_err(|x| AppError::Request(x.to_string()))?;

        let mut file =
            File::create(path).map_err(|_| AppError::File("Failed to create file".to_string()))?;

        let total_size = resp.content_length();
        let mut downloaded: u64 = 0;
        let mut stream = resp.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk =
                chunk.map_err(|_| AppError::Request("Failed to resolve next chunk".to_string()))?;

            file.write_all(&chunk)
                .map_err(|_| AppError::Request("Failed to write chunks".to_string()))?;

            downloaded += chunk.len() as u64;

            cb(downloaded, total_size);
        }

        Ok(())
    }
}

pub fn init_tracer(dsn: String) -> anyhow::Result<SdkTracerProvider> {
    // Configure gRPC metadata with Uptrace DSN
    let mut metadata = MetadataMap::with_capacity(1);
    metadata.insert("uptrace-dsn", dsn.parse().unwrap());

    // Create OTLP span exporter
    let exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_tonic()
        .with_tls_config(ClientTlsConfig::new().with_native_roots())
        .with_endpoint("https://api.uptrace.dev:4317")
        .with_metadata(metadata)
        .with_timeout(Duration::from_secs(10))
        .build()?;

    let resource = Resource::builder()
        .with_attribute(KeyValue::new("service.name", "differ"))
        .build();

    // Build the tracer provider
    let provider = SdkTracerProvider::builder()
        .with_batch_exporter(exporter)
        .with_resource(resource)
        .build();

    Ok(provider)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_normalise_path_replaces_backslashes() {
        let input = r"C:\Users\Test\Documents";
        let result = Utils::normalise_path(input);

        assert_eq!(result, "C:/Users/Test/Documents");
    }

    #[test]
    fn test_normalise_path_handles_double_backslashes() {
        let input = r"C:\\Users\\Test";
        let result = Utils::normalise_path(input);

        assert_eq!(result, "C:/Users/Test");
    }

    #[test]
    fn test_get_document_dir_returns_path() {
        let dir = Utils::get_document_dir();

        assert!(dir.is_ok());
        let dir: PathBuf = dir.unwrap();
        assert!(dir.exists());
    }

    #[test]
    fn test_get_random_id_is_valid_uuid() {
        let id = Utils::get_random_id();

        // UUID v4 string length is always 36
        assert_eq!(id.len(), 36);

        // Should be parseable as UUID
        assert!(uuid::Uuid::parse_str(&id).is_ok());
    }

    #[test]
    fn test_get_random_port_returns_non_zero_port() {
        let port = Utils::get_random_port();

        assert!(port > 0);
    }

    #[test]
    fn test_get_timestamp_format() {
        let timestamp = Utils::get_timestamp();

        // Expected format: YYYY-MM-DD HH:MM:SS
        assert_eq!(timestamp.len(), 19);
        assert!(timestamp.contains('-'));
        assert!(timestamp.contains(':'));
        assert!(timestamp.contains(' '));
    }
}
