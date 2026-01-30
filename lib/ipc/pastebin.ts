import { DownloadChannel } from "@/hooks/use-download";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";

export type LocalAttachment = {
	original_file_name: string;
	original_file_size: number;
	path_on_disk: string;
};

export type LocalPastes = {
	id: string;
	body: string;
	attachments: LocalAttachment[];
	created_at: string;
	updated_at: string;
};

export type RemotePastes = {
	_id: string;
	appId: string;
	accountId: string;
	body: string;
	_creationTime: number;
};

export const cmd_find_recent_local_pastes = async () => {
	return (await invoke(
		"cmd_find_recent_local_pastes",
		{},
	)) as LocalPastes[];
};

export type SaveRemotePasteLocally = Pick<RemotePastes, "_id" | "body">;

export type SaveRemotePasteResponse = {
	pasteId: string | null;
};

export type SaveRemotePaste = {
	appId: string;
	body: string;
};

export const cmd_get_paste_by_id = async (pasteId: string) => {
	return (await invoke("cmd_get_paste_by_id", {
		paste_id: pasteId,
	})) as LocalPastes;
};

export const cmd_save_remote_paste = async (args: SaveRemotePaste) => {
	return (await invoke("cmd_save_remote_paste", {
		app_id: args.appId,
		body: args.body,
	})) as SaveRemotePasteResponse;
};

export const deleteRemotePasteById = async (pasteId: string) => {
	return (await invoke("cmd_delete_remote_paste_by_id", {
		paste_id: pasteId,
	})) as boolean;
};

export const cmd_save_remote_paste_locally = async (
	args: SaveRemotePasteLocally,
	channel: DownloadChannel,
) => {
	return (await invoke("cmd_save_remote_paste_locally", {
		paste_id: args._id,
		body: args.body,
		channel,
	})) as boolean;
};

export const cmd_delete_local_paste_by_id = async (pasteId: string) => {
	return (await invoke("cmd_delete_local_paste_by_id", {
		paste_id: pasteId,
	})) as boolean;
};

export const cmd_convex_query = async () => {
	await invoke("cmd_convex_query", {});

	// Unlisten
	return async () => {
		await emit("cmd_convex_query_close", "");
	};
};

type IsSyncedResponse = {
	isSynced: boolean;
};

export const cmd_is_synced = async (appId: string) => {
	const data = (await invoke("cmd_is_synced", {
		app_id: appId,
	})) as IsSyncedResponse;

	return data;
};

export type SyncAppArgs = {
	appId: string;
};

export const cmd_sync_app_to_remote_server = async (args: SyncAppArgs) => {
	const data = (await invoke("cmd_sync_app_to_remote_server", {
		app_id: args.appId,
	})) as void;

	return data;
};
