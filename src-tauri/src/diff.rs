

use diff::{lines, Result};

struct DiffResult {
    left: String,
    old: String,
    right: String,
}

#[tauri::command]
pub fn diff_text(old_text: &str, new_text: &str) {
    // "Hello".to_string()

    let left: &str = "This is my friend";
    let right = "This is my enemy.";

    // let mut temp = DiffResult {
    //     left: "".to_string(),
    //     old: "".to_string(),
    //     right: "".to_string(),
    // };

    // for line in lines(left, right) {
    //     match line {
    //         Result::Left(l) => println!("-{}", l),
    //         Result::Both(l, _) => println!(" {}", l),
    //         Result::Right(r) => println!("+{}", r),
    //     }
    // }

    for line in lines(left, right) {
        match line {
            Result::Left(l) => println!("-{}", l),
            Result::Both(l, _) => println!(" {}", l),
            Result::Right(r) => println!("+{}", r),
        }
    }
}

