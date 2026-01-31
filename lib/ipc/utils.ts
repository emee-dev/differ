import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export const getEndpoint = async (): Promise<string | null> => {
	const taskStatus = (await invoke(
		"cmd_get_chat_api_endpoint",
		{},
	)) as TaskStatus;

	if (!taskStatus) return null;

	if (taskStatus.type !== "Endpoint") return null;

	return taskStatus.url;
};

export const filePicker = async () => {
	const file_path = await open({
		multiple: false,
		directory: false,
	});

	if (!file_path) return null;

	const data = (await invoke("cmd_read_file", { file_path })) as {
		name: string;
		contents: string;
	};

	return data;
};

export type AppConfig = {
	last_tab?: string;
	anthropic_key?: string;
	google_key?: string;
	groq_key?: string;
	openai_key?: string;
	app_id: string;
	selected_provider?: string;
	selected_model?: string;
};

export const cmd_update_app_config = async (config: AppConfig) => {
	return (await invoke("cmd_update_app_config", {
		config,
	})) as boolean;
};

export const cmd_get_app_config = async () => {
	const data = (await invoke("cmd_get_app_config", {})) as AppConfig;

	if (!data) return null;

	return data;
};

export type TaskStatus =
	| { type: "Initialized" }
	| { type: "Operational" }
	| { type: "Panicked"; error: string }
	| { type: "Endpoint"; url: string };

export type Tasks = {
	id: "convex_subscription" | "chat_api";
	status: TaskStatus;
};

export const cmd_get_all_tasks = async () => {
	const data = (await invoke("cmd_get_all_tasks", {})) as Tasks[];

	if (!data) return [];

	return data;
};

export const cmd_open_url = async (url: string) => {
	(await invoke("cmd_open_url", {
		url,
	})) as void;
};
