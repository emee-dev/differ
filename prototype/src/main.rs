#![allow(clippy::all)]

use futures::StreamExt;
use std::fs::File;
use std::io::Write;
use std::path::Path;

#[tokio::main]
async fn main() {
    // if webbrowser::open("https://ai-sdk.dev/providers/ai-sdk-providers/openai").is_ok() {}

    let path = Path::new("example.exe");
    download_file("some_file", path, |downloaded, _| {
        println!("Downloaded: {downloaded}");
    })
    .await;
}

async fn download_file<T: FnMut(u64, Option<u64>)>(url: &str, path: &Path, mut f: T) -> () {
    let resp = reqwest::get(url).await.expect("request failed");

    let mut file = File::create(path).expect("failed to create file");

    let total_size = resp.content_length(); // Option<u64>
    let mut downloaded: u64 = 0;
    let mut stream = resp.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.expect("chunk error");

        file.write_all(&chunk).expect("failed to write chunk");

        downloaded += chunk.len() as u64;

        f(downloaded, total_size);
    }
}
