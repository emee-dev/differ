import {
	ChatsRecord,
	cmd_delete_chat_by_id,
	cmd_find_recent_chats,
	cmd_get_chat_by_id,
	cmd_save_initial_chat,
	update_chat_message,
	UpdateChat,
} from "@/lib/ipc/chats";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChatStatus } from "ai";
import { useEffect } from "react";
import { toast } from "sonner";

export const useQueryChatById = (chatId?: string) => {
	const r = useQuery({
		queryKey: ["fetch_chat_by_id", chatId],
		queryFn: async () => {
			return await cmd_get_chat_by_id(chatId as string);
		},
		enabled: !!chatId,
	});

	useEffect(() => {
		if (!r.error) return;

		toast.error("Unable to load chat", {
			description:
				"The selected chat could not be loaded. It may have been deleted or is no longer available.",
		});

		console.error("Failed to fetch chat by id:", r.error);
	}, [r.error]);

	return r;
};

export const useUpdateChat = () => {
	const r = useMutation({
		mutationKey: ["update_chat_messages"],
		mutationFn: async (data: UpdateChat) => {
			return {
				status: await update_chat_message(data),
				chatId: data.chat_id,
			};
		},
	});

	return r;
};

export const useSaveInitialChat = ({
	isFirstChat,
	status,
}: {
	status: ChatStatus;
	isFirstChat: boolean;
}) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const r = useMutation({
		mutationKey: ["save_initial_chat"],
		mutationFn: async (data: ChatsRecord) => {
			await cmd_save_initial_chat(data);

			return data.id;
		},
		onError(e) {
			console.log("Error: ", e);
		},
		onSuccess: async (chatId) => {
			if (status === "ready" && isFirstChat === true) {
				await new Promise((r) => setTimeout(r, 1500));

				// Refresh sidebar
				queryClient.invalidateQueries({
					queryKey: ["fetch_recent_chats"],
				});

				navigate({
					to: "/chats/$chatId",
					params: {
						chatId,
					},
				});
			}
		},
	});

	return r;
};

export const useQueryRecentChats = () => {
	const r = useQuery({
		queryKey: ["fetch_recent_chats"],
		queryFn: async () => {
			return await cmd_find_recent_chats();
		},
		initialData: [],
	});

	useEffect(() => {
		if (!r.error) return;

		toast.error("Unable to load recent chats", {
			description:
				"Your recent chats could not be retrieved. Please try again.",
		});

		console.error("Failed to fetch recent chats:", r.error);
	}, [r.error]);

	return r;
};

export const useDeleteChat = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const r = useMutation({
		mutationKey: ["delete_chat_by_id"],
		mutationFn: (chatId: string) => {
			return cmd_delete_chat_by_id(chatId);
		},

		onSuccess() {
			toast.success("Chat deleted", {
				description: "The chat has been removed successfully.",
			});

			queryClient.invalidateQueries({
				queryKey: ["fetch_recent_chats"],
			});

			navigate({
				to: "/chats",
			});
		},

		onError(error) {
			toast.error("Failed to delete chat", {
				description:
					"The chat could not be deleted. Please try again.",
			});

			console.error("Chat deletion failed:", error);
		},
	});

	return r;
};
