// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::Ok;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    differ_lib::run().await?;

    Ok(())
}
