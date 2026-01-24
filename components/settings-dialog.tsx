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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useQueryAppConfig, useUpdateAppConfig } from "@/hooks/use-app-config";
import { AppConfig } from "@/lib/fns/utils";
import { cn } from "@/lib/utils";
import { useLocation } from "@tanstack/react-router";
import {
	Check,
	Clipboard,
	KeyRound,
	Loader,
	Settings as SettingsIcon,
	Shield,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type ApiKeys = Required<
	Omit<
		AppConfig,
		"last_tab" | "app_id" | "selected_model" | "selected_provider"
	>
>;

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
	const { data: config } = useQueryAppConfig();

	const location = useLocation();
	const [section, setSection] = useState<"general" | "api" | "paste">(
		"general",
	);
	const [copied, setCopied] = useState<boolean>(false);
	const [rememberScreen, setRememberScreen] = useState<boolean>(true);

	const [apiKeys, setApiKeys] = useState<ApiKeys>({
		groq_key: "",
		google_key: "",
		openai_key: "",
		anthropic_key: "",
	});

	const { isPending, mutate } = useUpdateAppConfig();

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
						</nav>
					</aside>

					{/* Content */}
					<main className="flex-1 overflow-y-auto p-6">
						{section === "general" && (
							<Section
								title="General"
								description="Startup and identity settings">
								<Row
									title="Remember last screen"
									description="Restore your previous workspace on launch"
									action={
										<Switch
											checked={
												rememberScreen
											}
											onCheckedChange={
												setRememberScreen
											}
										/>
									}
								/>

								<Separator />

								<div className="space-y-2">
									<Label className="text-sm">
										Application ID
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
							</Section>
						)}

						{section === "api" && (
							<Section
								title="API Keys"
								description="Stored locally on this machine">
								<KeyField
									label="Google"
									placeholder="Your google secret"
									value={apiKeys.google_key}
									onChange={(v) =>
										setApiKeys({
											...apiKeys,
											google_key: v,
										})
									}
								/>
								<KeyField
									label="OpenAI"
									placeholder="Your openai secret"
									value={apiKeys.openai_key}
									onChange={(v) =>
										setApiKeys({
											...apiKeys,
											openai_key: v,
										})
									}
								/>
								<KeyField
									label="Groq"
									placeholder="Your groq secret"
									value={apiKeys.groq_key}
									onChange={(v) =>
										setApiKeys({
											...apiKeys,
											groq_key: v,
										})
									}
								/>

								<div className="flex items-center ">
									<Button
										className="ml-auto"
										disabled={isPending}
										onClick={() => {
											if (!config) {
												console.log(
													"No config",
												);
												return;
											}

											mutate({
												app_id: config.app_id,
												google_key:
													apiKeys.google_key,
												groq_key: apiKeys.groq_key,
												openai_key:
													apiKeys.openai_key,
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
							</Section>
						)}

						{section === "paste" && (
							<Section
								title="Pastebins"
								description="Security options for shared pastes">
								<div className="space-y-2 max-w-md">
									<Label className="text-sm">
										Paste password
									</Label>
									<Input
										type="password"
										placeholder="Your password"
										value={
											pastePassword
										}
										onChange={(e) =>
											setPastePassword(
												e.target
													.value,
											)
										}
									/>
								</div>
							</Section>
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

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold">{title}</h2>
				{description && (
					<p className="text-sm text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			{children}
		</div>
	);
}

function Row({
	title,
	description,
	action,
}: {
	title: string;
	description?: string;
	action: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between rounded-lg border p-4">
			<div className="space-y-1">
				<p className="text-sm font-medium">{title}</p>
				{description && (
					<p className="text-xs text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			{action}
		</div>
	);
}

function KeyField({
	label,
	value,
	onChange,
	placeholder,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div className="space-y-1 max-w-xl">
			<Label className="text-sm">{label} API key</Label>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="font-mono text-sm"
				placeholder={placeholder}
			/>
		</div>
	);
}
