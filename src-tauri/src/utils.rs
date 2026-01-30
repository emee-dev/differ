use crate::constants::{APP_ID, ATTACHMENTS, DB_ID};
use crate::prelude::*;
use chrono::Local;
use directories::UserDirs;
use futures_util::StreamExt;
use port_selector::{random_free_tcp_port, Port};
use sqlx::sqlite::SqlitePoolOptions;
use std::fs::File;
use std::io::Write;
use std::io::{BufReader, Cursor};
use std::path::{Path, PathBuf};
use tokio::fs;
use tokio::fs::OpenOptions;
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
