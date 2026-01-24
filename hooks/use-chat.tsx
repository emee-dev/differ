import { deleteChatById, getChatById, queryRecentChats } from "@/lib/fns/chats";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export const useQueryChatById = (chatId?: string) => {
	const r = useQuery({
		queryKey: ["fetch_chat_by_id", chatId],
		queryFn: async () => {
			return await getChatById(chatId as string);
		},
		enabled: !!chatId,
	});

	return r;
};

export const useQueryRecentChats = () => {
	const r = useQuery({
		queryKey: ["fetch_recent_chats"],
		queryFn: async () => {
			return await queryRecentChats();
		},
		initialData: [],
	});

	return r;
};

export const useDeleteChat = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const r = useMutation({
		mutationKey: ["delete_chat_by_id"],
		mutationFn: (chatId: string) => {
			console.log("ChatId", chatId);
			return deleteChatById(chatId);
		},
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ["fetch_recent_chats"],
			});

			navigate({
				to: "/chats",
			});
		},
	});

	return r;
};
