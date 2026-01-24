use crate::prelude::*;
use chrono::Local;
use directories::UserDirs;
use port_selector::{random_free_tcp_port, Port};
use sqlx::sqlite::SqlitePoolOptions;
use std::fs;
use std::path::PathBuf;
use tokio::fs::OpenOptions;
use uuid::Uuid;

pub const APP_ID: &str = "Differ";
pub const DB_ID: &str = "differ.db";
pub const ATTACHMENTS: &str = "attachments";

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

        let app_directory = format!("{}/{}", document_dir.to_str().unwrap_or(""), APP_ID);

        let app_directory = Utils::normalise_path(app_directory.as_str());
        let db_directory = format!("{}/{}", app_directory, DB_ID);
        let attachments_directory = format!("{}/{}", app_directory, ATTACHMENTS);

        match fs::create_dir_all(&app_directory) {
            Ok(_) => (),
            Err(msg) => panic!("Failed to create app directory: {:?}", msg),
        }

        match fs::create_dir_all(&attachments_directory) {
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
}
