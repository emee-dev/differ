// use std::{
//     env::{self, current_dir},
//     path::Path,
//     process::Command,
// };

// fn main() {
//     let output = Command::new("git")
//         .arg("diff")
//         .output()
//         .expect("failed to execute git diff");

//     let stdout = String::from_utf8_lossy(&output.stdout);
//     let stderr = String::from_utf8_lossy(&output.stderr);

//     if stdout.is_empty() {
//         println!("No diff output");
//     } else {
//         println!("Diff output:\n{}", stdout);
//     }

//     if !stderr.is_empty() {
//         eprintln!("Git stderr:\n{}", stderr);
//     }
// }

mod error;

use anyhow::anyhow;
use convex::ConvexClient;
use futures::{StreamExt, TryFutureExt};
use std::{collections::BTreeMap, env, path::Path, thread};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let path = Path::new("../.env.local");

    dotenvy::from_path(path).ok();
    dotenvy::dotenv().ok();

    let deployment_url: String = env::var("VITE_CONVEX_URL").unwrap();
    println!("Compiled: {:?}", deployment_url);
    let mut client = ConvexClient::new(deployment_url.as_str()).await?;
    let mut sub = client
        .subscribe("fns:getPasteBins", maplit::btreemap! {})
        .await?;

    while let Some(result) = sub.next().await {
        println!("{result:?}");
    }

    // println!("Deployment: {:?}", deployment_url);

    Ok(())
}
