import { AIChat } from "@/components/ai-chat";
import { useQueryAppConfig } from "@/hooks/use-app-utils";
import { useQueryChatById, useUpdateChat } from "@/hooks/use-chat";
import { useMessages } from "@/hooks/use-messages";
import { getEndpoint } from "@/lib/ipc/utils";
import { Model, models } from "@/lib/llms";
import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/chats/$chatId")({
	component: RouteComponent,
	async loader() {
		return getEndpoint();
	},
});

function RouteComponent() {
	const params = Route.useParams();
	const endpoint = Route.useLoaderData();
	const { data } = useQueryChatById(params.chatId);
	const { data: config } = useQueryAppConfig();
	const [model, setModel] = useState<string>("");
	const [selectedModel, setSelectedModel] = useState<Model | null>(null);

	const transport = useMemo(() => {
		return new DefaultChatTransport({
			api: `${endpoint}/api/chat`,
		});
	}, [endpoint]);

	const {
		messages,
		sendMessage,
		status,
		id,
		regenerate,
		setMessages,
		error,
	} = useChat({
		transport,
	});

	const { mutate: updateMessages } = useUpdateChat();

	const {
		containerRef: messagesContainerRef,
		endRef: messagesEndRef,
		isAtBottom,
		scrollToBottom,
		hasSentMessage,
	} = useMessages({
		status,
	});

	// Init messages on load
	useEffect(() => {
		if (data) {
			setMessages(JSON.parse(data.messages));
		}
	}, [data]);

	// Upsert chat if it is not streaming and has no error
	useEffect(() => {
		if (status === "ready" && !error) {
			updateMessages({ chat_id: id, messages });
		}
	}, [status, messages, id, error]);

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
