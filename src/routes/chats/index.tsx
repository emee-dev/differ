import { AIChat } from "@/components/ai-chat";
import { useQueryAppConfig } from "@/hooks/use-app-config";
import { useMessages } from "@/hooks/use-messages";
import { Model, models } from "@/lib/data";
import { ChatsRecord, saveInitialChat } from "@/lib/fns/chats";
import { getEndpoint } from "@/lib/fns/utils";
import { useChat } from "@ai-sdk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/chats/")({
	component: RouteComponent,
	async loader() {
		return await getEndpoint();
	},
});

function RouteComponent() {
	const endpoint = Route.useLoaderData();
	const navigate = useNavigate();
	const { data: config } = useQueryAppConfig();
	const [model, setModel] = useState<string>("");
	const [selectedModel, setSelectedModel] = useState<Model | null>(null);
	const [isFirstChat, setIsFirstChat] = useState(false);
	const queryClient = useQueryClient();

	const transport = useMemo(() => {
		return new DefaultChatTransport({
			api: `${endpoint}/api/chat`,
		});
	}, [endpoint]);

	const {
		id,
		status,
		messages,
		regenerate,
		sendMessage,
		setMessages,
		error,
	} = useChat({
		transport,
		onFinish(result) {
			if (result.isAbort) return;
			if (result.isDisconnect) return;
			if (result.isError) return;

			setIsFirstChat(true);
		},

		onError(err) {
			console.error(err.stack);
		},
	});

	const { mutate } = useMutation({
		mutationKey: ["save_initial_chat"],
		mutationFn: async (data: ChatsRecord) => {
			await saveInitialChat(data);

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

	const {
		containerRef: messagesContainerRef,
		endRef: messagesEndRef,
		isAtBottom,
		scrollToBottom,
		hasSentMessage,
	} = useMessages({
		status,
	});

	// Save the initial chat once it is ready ie. not streaming.
	useEffect(() => {
		if (status === "ready" && !error && isFirstChat === true) {
			let label = "";

			let m = messages.at(0);
			let p = m?.parts.at(0);

			if (p && p.type === "text") {
				label = p.text.slice(0, 35);
			}

			mutate({ id, label, messages });
		}
	}, [status, messages, id, error, isFirstChat]);

	useEffect(() => {
		if (config && config.selected_model) {
			const model = models.find(
				(m) => m.id === config.selected_model,
			) as unknown as Model;

			setModel(config.selected_model);
			setSelectedModel(model);
		}
	}, [config]);

	return (
		<AIChat
			error={error}
			model={model}
			config={config}
			status={status}
			setModel={setModel}
			messages={messages}
			regenerate={regenerate}
			isAtBottom={isAtBottom}
			setMessages={setMessages}
			sendMessage={sendMessage}
			selectedModel={selectedModel}
			scrollToBottom={scrollToBottom}
			messagesEndRef={messagesEndRef}
			hasSentMessage={hasSentMessage}
			messagesContainerRef={messagesContainerRef}
		/>
	);
}
