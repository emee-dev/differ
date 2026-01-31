import { Greeting } from "@/components/ai-elements/greeting";
import {
	ModelSelector,
	ModelSelectorContent,
	ModelSelectorEmpty,
	ModelSelectorGroup,
	ModelSelectorInput,
	ModelSelectorItem,
	ModelSelectorList,
	ModelSelectorLogo,
	ModelSelectorLogoGroup,
	ModelSelectorName,
	ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	type PromptInputMessage,
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { PreviewMessage, ThinkingMessage } from "@/components/preview-message";
import { useUpdateModelProvider } from "@/hooks/use-app-utils";
import { AppConfig } from "@/lib/ipc/utils";
import { Model, models } from "@/lib/llms";
import { useChat } from "@ai-sdk/react";
import { ChatStatus } from "ai";
import { ArrowDownIcon, CheckIcon, RefreshCcw } from "lucide-react";
import { Dispatch, RefObject, SetStateAction, useState } from "react";
import { Button } from "./ui/button";

type UseChat = ReturnType<typeof useChat>;

type AIChatProps = {
	error: any;
	status: ChatStatus;
	model: string;
	setModel: Dispatch<SetStateAction<string>>;
	config: AppConfig | null;
	selectedModel: Model | null;
	isAtBottom: any;
	messagesContainerRef: RefObject<HTMLDivElement | null>;
	messagesEndRef: RefObject<HTMLDivElement | null>;
	hasSentMessage: boolean;
	scrollToBottom: (behavior?: ScrollBehavior) => void;
	sendMessage: UseChat["sendMessage"];
	messages: UseChat["messages"];
	regenerate: UseChat["regenerate"];
	setMessages: UseChat["setMessages"];
};

export const AIChat = ({
	error,
	status,
	model,
	setModel,
	sendMessage: onSubmit,
	config,
	selectedModel,
	isAtBottom,
	messages,
	messagesContainerRef,
	regenerate,
	hasSentMessage,
	setMessages,
	messagesEndRef,
	scrollToBottom,
}: AIChatProps) => {
	const disabled = !config;
	const { mutate, isPending } = useUpdateModelProvider();
	const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

	const chefs = Array.from(new Set(models.map((m) => m.chef)));
	const handleSubmit = (message: PromptInputMessage) => {
		const hasText = Boolean(message.text);
		const hasAttachments = Boolean(message.files?.length);

		if (!(hasText || hasAttachments)) {
			return;
		}

		onSubmit({
			text: message.text,
			files: message.files,
		});
	};

	return (
		<div className="overscroll-behavior-containx flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
			<div className="relative flex-1">
				<div
					className="absolute inset-0 touch-pan-y overflow-y-auto thin-scrollbar"
					ref={messagesContainerRef}>
					<div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
						{messages.length === 0 && <Greeting />}

						{messages.map((message, index) => (
							<PreviewMessage
								isLoading={
									status === "streaming" &&
									messages.length - 1 ===
										index
								}
								key={message.id}
								message={message}
								regenerate={regenerate}
								requiresScrollPadding={
									hasSentMessage &&
									index ===
										messages.length - 1
								}
								setMessages={setMessages}
							/>
						))}

						{error && (
							<div className="flex flex-col w-full justify-center gap-y-1.5">
								<div>An error occurred.</div>
								<Button
									variant="outline"
									className="w-fit"
									size="sm"
									onClick={() =>
										regenerate()
									}>
									<RefreshCcw className="size-4 mr-1" />
									Retry{" "}
								</Button>
							</div>
						)}

						{status === "submitted" &&
							!messages.some((msg) =>
								msg.parts?.some(
									(part) =>
										"state" in part &&
										part.state ===
											"approval-responded",
								),
							) && <ThinkingMessage />}

						<div
							className="min-h-6 min-w-6 shrink-0"
							ref={messagesEndRef}
						/>
					</div>
				</div>

				<button
					className={`absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted ${
						isAtBottom
							? "pointer-events-none scale-0 opacity-0"
							: "pointer-events-auto scale-100 opacity-100"
					}`}
					onClick={() => scrollToBottom("smooth")}
					type="button">
					<ArrowDownIcon className="size-4" />
				</button>
			</div>

			<div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
				<PromptInputProvider>
					<PromptInput
						globalDrop
						multiple
						onSubmit={handleSubmit}>
						<PromptInputAttachments>
							{(attachment) => (
								<PromptInputAttachment
									data={attachment}
								/>
							)}
						</PromptInputAttachments>
						<PromptInputBody>
							<PromptInputTextarea
								disabled={disabled}
							/>
						</PromptInputBody>
						<PromptInputFooter>
							<PromptInputTools>
								<PromptInputActionMenu>
									<PromptInputActionMenuTrigger />
									<PromptInputActionMenuContent>
										<PromptInputActionAddAttachments />
									</PromptInputActionMenuContent>
								</PromptInputActionMenu>
								<ModelSelector
									onOpenChange={
										setModelSelectorOpen
									}
									open={modelSelectorOpen}>
									<ModelSelectorTrigger
										asChild>
										<PromptInputButton
											disabled={
												isPending
											}>
											{selectedModel?.chefSlug && (
												<ModelSelectorLogo
													provider={
														selectedModel.chefSlug
													}
												/>
											)}
											{selectedModel?.name && (
												<ModelSelectorName>
													{
														selectedModel.name
													}
												</ModelSelectorName>
											)}
										</PromptInputButton>
									</ModelSelectorTrigger>
									<ModelSelectorContent>
										<ModelSelectorInput placeholder="Search models..." />
										<ModelSelectorList>
											<ModelSelectorEmpty>
												No
												models
												found.
											</ModelSelectorEmpty>
											{chefs.map(
												(
													chef,
												) => (
													<ModelSelectorGroup
														heading={
															chef
														}
														key={
															chef
														}>
														{models
															.filter(
																(
																	m,
																) =>
																	m.chef ===
																	chef,
															)
															.map(
																(
																	m,
																) => (
																	<ModelSelectorItem
																		key={
																			m.id
																		}
																		onSelect={() => {
																			if (
																				!config
																			) {
																				console.log(
																					"No config available.",
																				);
																				return;
																			}

																			const selected_model =
																				m.id;
																			const selected_provider =
																				m.chefSlug;

																			mutate(
																				{
																					app_id: config.app_id,
																					selected_provider,
																					selected_model,
																				},
																			);

																			setModel(
																				selected_model,
																			);
																			setModelSelectorOpen(
																				false,
																			);
																		}}
																		value={
																			m.id
																		}>
																		<ModelSelectorLogo
																			provider={
																				m.chefSlug
																			}
																		/>
																		<ModelSelectorName>
																			{
																				m.name
																			}
																		</ModelSelectorName>
																		<ModelSelectorLogoGroup>
																			{m.providers.map(
																				(
																					provider,
																				) => (
																					<ModelSelectorLogo
																						key={
																							provider
																						}
																						provider={
																							provider
																						}
																					/>
																				),
																			)}
																		</ModelSelectorLogoGroup>
																		{model ===
																		m.id ? (
																			<CheckIcon className="ml-auto size-4" />
																		) : (
																			<div className="ml-auto size-4" />
																		)}
																	</ModelSelectorItem>
																),
															)}
													</ModelSelectorGroup>
												),
											)}
										</ModelSelectorList>
									</ModelSelectorContent>
								</ModelSelector>
							</PromptInputTools>
							<PromptInputSubmit status={status} />
						</PromptInputFooter>
					</PromptInput>
				</PromptInputProvider>
			</div>
		</div>
	);
};
