use crate::constants::{APP_ID, ATTACHMENTS};
use crate::ipc_convex::convex_delete_paste;
use crate::db_pastebin::create_paste;
use crate::db_pastebin::delete_paste_by_id;
use crate::db_pastebin::find_many;
use crate::db_pastebin::findone_by_id;
use crate::db_pastebin::AttachmentRecord;
use crate::db_pastebin::PasteRecord;
use crate::prelude::*;
use crate::utils::Utils;
use convex::FunctionResult;
use serde::Deserialize;
use serde::Serialize;
use std::path::Path;
use tauri::ipc::Channel;
use tauri::Manager;
use tauri::Runtime;
use tauri::{self, AppHandle};
use tokio::fs;

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_get_paste_by_id<R: Runtime>(
    app: AppHandle<R>,
    paste_id: &str,
) -> anyhow::Result<PasteRecord, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let query = findone_by_id(db, paste_id).await.map_err(to_app_err)?;

    Ok(query)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_find_recent_local_pastes(
    app: AppHandle,
) -> anyhow::Result<Vec<PasteRecord>, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let result = find_many(db).await.map_err(to_app_err)?;

    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_delete_remote_paste_by_id(
    app: AppHandle,
    paste_id: &str,
) -> anyhow::Result<(), AppError> {
    let app_state = app.state::<DbOnlyState>();

    let convex_client = app_state.convex_client.clone();

    let args = maplit::btreemap! {
        "pasteId".to_string() => paste_id.into(),
    };

    convex_delete_paste(convex_client, args).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_delete_local_paste_by_id(
    app: AppHandle,
    paste_id: &str,
) -> anyhow::Result<bool, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let operation = delete_paste_by_id(db, paste_id).await.map_err(to_app_err)?;

    let result = operation.rows_affected() == 1;
    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_save_remote_paste<R: Runtime>(
    app: AppHandle<R>,
    app_id: &str,
    body: &str,
) -> anyhow::Result<SaveRemotePasteResponse, AppError> {
    let app_state = app.state::<DbOnlyState>();

    let mut convex_client = app_state.convex_client.clone();

    let args = maplit::btreemap! {
        "appId".to_string() => app_id.into(),
        "body".to_string() => body.into(),
    };

    let result = convex_client
        .mutation("fns:savePaste", args)
        .await
        .map_err(to_app_err)?;

    match result {
        FunctionResult::Value(value) => {
            let json_value = value.export();

            println!("Json value: {:?}", json_value);

            Ok(serde_json::from_value::<SaveRemotePasteResponse>(
                json_value,
            )?)
        }
        FunctionResult::ConvexError(err) => Err(AppError::Convex(err.to_string())),
        FunctionResult::ErrorMessage(err_msg) => Err(AppError::Convex(err_msg)),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_is_synced(
    app: AppHandle,
    app_id: &str,
) -> anyhow::Result<IsSyncedResponse, AppError> {
    let app_state = app.state::<DbOnlyState>();

    let mut convex_client = app_state.convex_client.clone();

    let args = maplit::btreemap! {
        "appId".to_string() => app_id.into(),
    };

    let result: FunctionResult = convex_client
        .query("fns:isSynced", args)
        .await
        .map_err(to_app_err)?;

    match result {
        FunctionResult::Value(value) => {
            let json_value = value.export();

            Ok(serde_json::from_value::<IsSyncedResponse>(json_value)?)
        }
        FunctionResult::ConvexError(err) => Err(AppError::Convex(err.to_string())),
        FunctionResult::ErrorMessage(err_msg) => Err(AppError::Convex(err_msg)),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_sync_app_to_remote_server(
    app: AppHandle,
    app_id: &str,
) -> anyhow::Result<IsSyncedResponse, AppError> {
    let app_state = app.state::<DbOnlyState>();

    let mut convex_client = app_state.convex_client.clone();

    let args = maplit::btreemap! {
        "appId".to_string() => app_id.into(),
    };

    let result: FunctionResult = convex_client
        .mutation("fns:syncApp", args)
        .await
        .map_err(to_app_err)?;

    match result {
        FunctionResult::Value(value) => {
            let json_value = value.export();

            Ok(serde_json::from_value::<IsSyncedResponse>(json_value)?)
        }
        FunctionResult::ConvexError(err) => Err(AppError::Convex(err.to_string())),
        FunctionResult::ErrorMessage(err_msg) => Err(AppError::Convex(err_msg)),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveRemotePasteResponse {
    #[serde(rename = "pasteId")]
    pub paste_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IsSyncedResponse {
    #[serde(rename = "isSynced")]
    pub is_synced: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Attachment {
    #[serde(rename = "_id")]
    pub id: String,

    #[serde(rename = "_creationTime")]
    pub creation_time: i32,

    #[serde(rename = "pasteId")]
    pub paste_id: String,

    #[serde(rename = "originalFileName")]
    pub original_file_name: String,

    #[serde(rename = "originalFileSize")]
    pub original_file_size: String,

    #[serde(rename = "storageId")]
    pub storage_id: String,

    #[serde(rename = "downloadUrl")]
    pub download_url: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(
    rename_all = "snake_case",
    rename_all_fields = "snake_case",
    tag = "event",
    content = "data"
)]
pub enum DownloadEvent<'a> {
    Started {
        total_files: usize,
    },
    Progress {
        file_name: String,
        downloaded: usize,
        total: Option<u64>,
    },
    Skipped {
        reason: String,
    },
    Finished {
        file_path: &'a str,
        file_name: String,
    },
    Done {},
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cmd_save_remote_paste_locally(
    app: AppHandle,
    paste_id: &str,
    body: &str,
    channel: Channel<DownloadEvent<'_>>,
) -> anyhow::Result<bool, AppError> {
    let state = app.state::<DbOnlyState>();
    let db = &state.db;

    let document_dir = Utils::get_document_dir().map_err(|_| AppError::NotFound)?;
    let document_dir = document_dir.to_str().ok_or(AppError::NotFound)?;

    let created_at = Utils::get_timestamp();
    let updated_at = Utils::get_timestamp();

    let app_state = app.state::<DbOnlyState>();

    let mut convex_client = app_state.convex_client.clone();

    let args = maplit::btreemap! {
        "pasteId".to_string() => paste_id.into(),
    };

    let result = convex_client
        .query("fns:get_attachments", args.clone())
        .await
        .map_err(to_app_err)?;

    let files = match result {
        FunctionResult::Value(value) => {
            let json_value = value.export();

            serde_json::from_value::<Vec<Attachment>>(json_value)
        }
        FunctionResult::ConvexError(err) => return Err(AppError::Convex(err.to_string())),
        FunctionResult::ErrorMessage(err_msg) => return Err(AppError::Convex(err_msg)),
    }?;

    let mut attachments: Vec<AttachmentRecord> = vec![];

    let app_directory = format!("{}/{}", document_dir, APP_ID);

    let app_directory = Utils::normalise_path(app_directory.as_str());

    channel
        .send(DownloadEvent::Started {
            total_files: files.len(),
        })
        .ok();

    for file in files {
        let download_url = file.download_url.unwrap_or_else(|| "".into());

        if download_url.is_empty() {
            channel
                .send(DownloadEvent::Skipped {
                    reason: format!(
                        "Skipping attachment: '{}'; Reason: failed to generate download url.",
                        file.original_file_name
                    ),
                })
                .ok();
            continue;
        }

        let attachment_dir = format!("{}/{}/{}", app_directory, ATTACHMENTS, paste_id);

        let file_path = format!("{}/{}", attachment_dir, file.original_file_name);

        fs::create_dir_all(attachment_dir)
            .await
            .map_err(|_| AppError::File("Failed to create directory for attachment".to_string()))?;

        let path = Path::new(file_path.as_str());

        Utils::download_file_with_progress(download_url.as_str(), path, |downloaded, total| {
            channel
                .send(DownloadEvent::Progress {
                    file_name: file.original_file_name.clone(),
                    downloaded: downloaded as usize,
                    total,
                })
                .ok();
        })
        .await
        .map_err(to_app_err)?;

        let file_path = path.to_str().ok_or(AppError::NotFound)?;

        channel
            .send(DownloadEvent::Finished {
                file_path,
                file_name: file.original_file_name.clone(),
            })
            .ok();

        attachments.push(AttachmentRecord {
            original_file_name: file.original_file_name,
            original_file_size: file.original_file_size,
            path_on_disk: file_path.to_string(),
        });
    }

    let paste = PasteRecord {
        id: Utils::get_random_id(),
        body: body.into(),
        attachments,
        created_at,
        updated_at,
    };

    channel.send(DownloadEvent::Done {}).ok();

    let query = create_paste(db, paste).await.map_err(to_app_err)?;
    convex_delete_paste(convex_client, args).await?;

    Ok(query.rows_affected() == 1)
}
