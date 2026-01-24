import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export const getEndpoint = async (): Promise<string | null> => {
	let endpoint = (await invoke("cmd_get_chat_api_endpoint", {})) as string;

	if (!endpoint || endpoint.length === 0) return null;

	return endpoint;
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

export const updateAppConfig = async (config: AppConfig) => {
	return (await invoke("cmd_update_app_config", {
		config,
	})) as boolean;
};

export const getAppConfig = async () => {
	const data = (await invoke("cmd_get_app_config", {})) as AppConfig;

	if (!data) return null;

	return data;
};
