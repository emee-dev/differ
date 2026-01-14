pub fn normalise_path(dir: &str) -> String {
    let mut path = String::from(dir);

    if path.contains("\\") {
        path = path.replace("\\\\", "/").as_str().to_string();
    };

    path = path.replace("\\", "/");

    path
}
