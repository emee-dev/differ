import { invoke } from "@tauri-apps/api/core";
import { Message } from "../types";

export type ChatsRecord = {
	id: string;
	label: String;
	messages: Message[];
};

export const saveInitialChat = async (chat: ChatsRecord) => {
	return await invoke("cmd_save_initial_chat", {
		chat: {
			id: chat.id,
			label: chat.label,
			messages: JSON.stringify(chat.messages),
		},
	});
};

export const getChatById = async (chatId: string) => {
	return (await invoke("cmd_get_chat_by_id", {
		chat_id: chatId,
	})) as Omit<ChatsRecord, "messages"> & { messages: string };
};

export const deleteChatById = async (chatId: string) => {
	return (await invoke("cmd_delete_chat_by_id", {
		chat_id: chatId,
	})) as boolean;
};

export type UpdateChat = {
	chat_id: string;
	messages: Message[];
};

export const updateChat = async (args: UpdateChat) => {
	return (await invoke("update_chat_message", {
		chat_id: args.chat_id,
		messages: JSON.stringify(args.messages),
	})) as boolean;
};

export const queryRecentChats = async () => {
	const results = (await invoke(
		"cmd_find_recent_chats",
		{},
	)) as ChatsRecord[];

	if (!results) return [];

	return results;
};
