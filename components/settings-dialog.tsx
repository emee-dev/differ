import { useSettingsDialog } from "@/components/settings-provider";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	useAllTasks,
	useOpenURL,
	useQueryAppConfig,
	useUpdateAppConfig,
} from "@/hooks/use-app-utils";
import { useSyncApp } from "@/hooks/use-pastebin";
import { AppConfig } from "@/lib/ipc/utils";
import { Providers } from "@/lib/llms";
import { cn } from "@/lib/utils";
import { useLocation } from "@tanstack/react-router";
import {
	Check,
	Clipboard,
	Cpu,
	ExternalLink,
	KeyRound,
	Loader,
	Save,
	Settings as SettingsIcon,
	Shield,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { AllTasks } from "./tasks";

type ApiKeys = Required<
	Omit<
		AppConfig,
		"last_tab" | "app_id" | "selected_model" | "selected_provider"
	>
>;

export function SettingsDialog() {
	const pasteClient = import.meta.env.VITE_PASTE_BIN_CLIENT;
	const { data: config } = useQueryAppConfig();
	const { mutate: syncAppToRemoteServer, isPending: isSyncing } =
		useSyncApp();
	const { mutate: openURL } = useOpenURL();
	const { isPending, mutate } = useUpdateAppConfig();
	const location = useLocation();
	const { section, setSection, open, onOpenChange, toggleDialog } =
		useSettingsDialog();
	const { data: tasks } = useAllTasks();
	const [copied, setCopied] = useState<boolean>(false);
	const [rememberScreen, setRememberScreen] = useState<boolean>(true);
	const [selectedProvider, setSelectedProvider] =
		useState<Providers>("google");

	const [apiKeys, setApiKeys] = useState<ApiKeys>({
		groq_key: "",
		google_key: "",
		openai_key: "",
		anthropic_key: "",
	});

	const [pastePassword, setPastePassword] = useState<string>("");

	useEffect(() => {
		if (!config) return;

		setApiKeys({
			groq_key: config?.groq_key || "",
			google_key: config?.google_key || "",
			openai_key: config?.openai_key || "",
			anthropic_key: config?.anthropic_key || "",
		});
	}, [config]);

	const copyToClipboard = (): void => {
		if (!config) return;
		navigator.clipboard.writeText(config.app_id);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xlx min-w-2xl p-0 overflow-hidden w-2xl">
				<div className="flex h-[560px]x h-[60vh] w-full">
					<aside className="w-48 border-r bg-muted/30 p-3">
						<DialogHeader className="px-2 pb-4">
							<DialogTitle className="text-lg">
								Settings
							</DialogTitle>
							<DialogDescription className="text-xs">
								Application preferences
							</DialogDescription>
						</DialogHeader>

						<nav className="space-y-1">
							<SidebarItem
								icon={
									<SettingsIcon className="h-4 w-4" />
								}
								active={section === "general"}
								onClick={() =>
									setSection("general")
								}>
								General
							</SidebarItem>
							<SidebarItem
								icon={
									<KeyRound className="h-4 w-4" />
								}
								active={section === "api"}
								onClick={() =>
									setSection("api")
								}>
								API Keys
							</SidebarItem>
							<SidebarItem
								icon={
									<Shield className="h-4 w-4" />
								}
								active={section === "paste"}
								onClick={() =>
									setSection("paste")
								}>
								Pastebins
							</SidebarItem>
							<SidebarItem
								icon={
									<Cpu className="h-4 w-4" />
								}
								active={section === "services"}
								onClick={() =>
									setSection("services")
								}>
								Services
							</SidebarItem>
						</nav>
					</aside>

					<main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
						{section === "general" && (
							<div className="space-y-6">
								<div>
									<h2 className="text-xl font-semibold">
										General
									</h2>
									<p className="text-sm text-muted-foreground">
										Startup and identity
										settings
									</p>
								</div>
								<div className="space-y-2">
									<Label className="text-sm">
										AppId
									</Label>
									<div className="flex gap-2">
										<Input
											readOnly
											value={
												config?.app_id ||
												""
											}
											className="font-mono text-sm"
										/>
										<Button
											variant="outline"
											size="sm"
											onClick={
												copyToClipboard
											}
											className={cn(
												copied &&
													"border-green-500 text-green-600",
											)}>
											{copied ? (
												<Check className="h-4 w-4" />
											) : (
												<Clipboard className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>

								<div className="flex items-center justify-between rounded-lg border p-4">
									<div className="space-y-1">
										<p className="text-sm font-medium">
											Remember last
											screen
										</p>
										<p className="text-xs text-muted-foreground">
											Restore your
											previous
											workspace on
											launch
										</p>
									</div>
									<Switch
										checked={
											rememberScreen
										}
										onCheckedChange={
											setRememberScreen
										}
									/>
								</div>
							</div>
						)}

						{section === "api" && (
							<div className="space-y-6">
								<div>
									<h2 className="text-xl font-semibold">
										API Keys
									</h2>
									<p className="text-sm text-muted-foreground">
										Stored locally on
										this machine
									</p>
								</div>
								<div className="space-y-4 max-w-xl">
									<div className="space-y-2">
										<Label className="text-sm">
											Provider
										</Label>
										<Select
											value={
												selectedProvider
											}
											onValueChange={(
												value,
											) =>
												setSelectedProvider(
													value as Providers,
												)
											}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="google">
													Google
												</SelectItem>
												<SelectItem value="openai">
													OpenAI
												</SelectItem>
												<SelectItem value="groq">
													Groq
												</SelectItem>
												<SelectItem value="anthropic">
													Anthropic
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label className="text-sm">
											{selectedProvider
												.charAt(
													0,
												)
												.toUpperCase() +
												selectedProvider.slice(
													1,
												)}{" "}
											API Key
										</Label>
										<Input
											value={
												apiKeys[
													`${selectedProvider}_key` as keyof ApiKeys
												]
											}
											placeholder={`Your ${selectedProvider} secret`}
											onChange={(
												e,
											) =>
												setApiKeys(
													{
														...apiKeys,
														[`${selectedProvider}_key`]:
															e
																.target
																.value,
													},
												)
											}
											className="font-mono text-sm"
										/>
									</div>
								</div>

								<div className="flex items-center pt-4">
									<Button
										className="ml-auto"
										disabled={isPending}
										onClick={() => {
											if (!config) {
												return;
											}

											mutate({
												app_id: config.app_id,
												google_key:
													apiKeys.google_key,
												groq_key: apiKeys.groq_key,
												openai_key:
													apiKeys.openai_key,
												anthropic_key:
													apiKeys.anthropic_key,
												last_tab: location.pathname,
											});
										}}>
										{isPending ? (
											<>
												<Loader className="animate-spin size-5" />{" "}
												Saving
											</>
										) : (
											<>Save</>
										)}
									</Button>
								</div>
							</div>
						)}

						{section === "paste" && (
							<div className="space-y-4 h-full flex flex-col">
								<div className="space-y-0.5">
									<h2 className="text-xl font-semibold">
										Pastebin
									</h2>
									<p className="text-sm text-muted-foreground">
										Configure your app
										for the pastebin
										utility
									</p>
								</div>
								<div className="flex items-center gap-2 text-sm mt-2x">
									<span className="text-muted-foreground">
										Pastebin:
									</span>

									<div
										className="inline-flex items-center gap-1 rounded-md px-2 py-1
										text-primary underline-offset-4 hover:underline
										hover:bg-muted transition-colors cursor-pointer"
										onClick={() =>
											openURL(
												pasteClient,
											)
										}>
										{pasteClient}
										<ExternalLink className="size-4" />
									</div>
								</div>

								<div className="space-y-5 max-w-md">
									<div className="space-y-2">
										<Label className="text-sm">
											App ID
										</Label>
										<Input
											placeholder="Your appId"
											defaultValue={
												config?.app_id ||
												""
											}
											readOnly
										/>
									</div>
								</div>

								<div className="flex items-center justify-end mt-auto">
									<Button
										variant="outline"
										size="sm"
										disabled={
											isSyncing ||
											!config
										}
										onClick={() => {
											if (!config)
												return;

											syncAppToRemoteServer(
												{
													appId: config.app_id,
												},
											);

											// Close dialog
											toggleDialog();
										}}
										className="gap-2">
										{isSyncing ? (
											<>
												<Loader className="h-4 w-4 animate-spin" />
												Syncing…
											</>
										) : (
											<>
												<Save className="h-4 w-4" />
												Sync app
											</>
										)}
									</Button>
								</div>
							</div>
						)}

						{section === "services" && (
							<div className="space-y-6">
								<div>
									<h2 className="text-xl font-semibold">
										Services
									</h2>
									<p className="text-sm text-muted-foreground">
										Long-running tasks
										and service status
									</p>
								</div>
								<AllTasks tasks={tasks} />
							</div>
						)}
					</main>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function SidebarItem({
	icon,
	active,
	onClick,
	children,
}: {
	icon: React.ReactNode;
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			onClick={onClick}
			className={cn(
				"flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition",
				active
					? "bg-background shadow-sm"
					: "text-muted-foreground hover:bg-muted",
			)}>
			{icon}
			{children}
		</button>
	);
}
