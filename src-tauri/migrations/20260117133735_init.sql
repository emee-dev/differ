DROP TABLE if EXISTS app_config;
DROP TABLE if EXISTS paste_bins;
DROP TABLE if EXISTS multi_file_diffs;
DROP TABLE if EXISTS ai_chats;

-- max a single table
CREATE TABLE app_config (
  id TEXT PRIMARY KEY NOT NULL,
  app_id TEXT NOT NULL,
  last_tab TEXT NOT NULL DEFAULT '',
  -- Ideally sensitive keys should be stored in a safe vault. But this is a hackathon so 😁😁😁
  anthropic_key TEXT DEFAULT '',
  google_key TEXT DEFAULT '',
  groq_key TEXT DEFAULT '',
  openai_key TEXT DEFAULT '',

  -- I could not config AiSDK rs to work. So am using SQLITE as a state manager.
  selected_provider TEXT DEFAULT '',
  selected_model TEXT DEFAULT ''
);

/*
type Attachments = {
  original_file_name: string,
  original_file_size: string,
  path_on_disk: string, // eg /documents/<app_folder>/attachments/<some_file_name.ext>
}
*/

CREATE TABLE paste_bins (
  id TEXT PRIMARY KEY NOT NULL, -- maps to convex '_id' key
  body TEXT NOT NULL,
  attachments TEXT NOT NULL DEFAULT '[]', -- JSON string
  created_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE multi_file_diffs (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  label TEXT NOT NULL,
  old_file TEXT NOT NULL,
  new_file TEXT NOT NULL
);

CREATE TABLE chats (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  messages TEXT NOT NULL DEFAULT '[]', -- JSON stringified VercelUIMessage from aisdk.rs
  created_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);