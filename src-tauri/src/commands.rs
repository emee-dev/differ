use std::{fs, path::Path};

use crate::utils::normalise_path;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct FileContents {
    pub name: String,
    pub contents: String,
}

#[tauri::command(rename_all = "snake_case")]
pub fn read_file(file_path: &str) -> FileContents {
    let normalized_path = normalise_path(file_path);
    let p = Path::new(normalized_path.as_str());

    let name = p.file_name().unwrap().to_str().unwrap().to_string();

    let contents =
        fs::read_to_string(normalized_path).expect("Should have been able to read the file");

    FileContents { name, contents }
}
