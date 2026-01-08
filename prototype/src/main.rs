use diff::{lines, Result};

pub fn diff_text(_old_text: &str, _new_text: &str) {
    let left = "This is my friend";
    let right = "This is my enemy.";

    for line in lines(left, right) {
        match line {
            Result::Left(l) => println!("-{}", l),
            Result::Both(l, r) => println!("@@{} {}", l, r),
            Result::Right(r) => println!("+{}", r),
        }
    }
}

fn main() {
    diff_text("", "")
}
