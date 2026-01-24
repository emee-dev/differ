import { SettingsDialog } from "@/components/settings-dialog";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { Calculator, CreditCard, Settings, User } from "lucide-react";
import type { ComponentType } from "react";
import * as React from "react";

export type CommandDefinition = {
	id: string;
	label: string;
	group: "suggestions" | "commands";
	icon?: ComponentType<any>;
	shortcut?: string;
	disabled?: boolean;
	run: (ctx: {
		navigate: (opts: { to: string }) => void;
		close: () => void;
	}) => void;
};

export function CmdMenu() {
	const [open, setOpen] = React.useState(false);
	const [showSettings, setShowSettings] = React.useState(false);
	const navigate = useNavigate();

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((v) => !v);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const ctx = React.useMemo(
		() => ({
			navigate,
			close: () => setOpen(false),
		}),
		[navigate],
	);

	const COMMANDS: CommandDefinition[] = [
		{
			id: "paste-bin-sync",
			label: "Sync device",
			group: "suggestions",
			icon: Calculator,
			disabled: true,
			run: () => {},
		},
		{
			id: "multi-file-diff",
			label: "Diff checker",
			group: "commands",
			icon: User,
			shortcut: "⌘P",
			run: ({ close }) => {
				navigate({ to: "/multi-file-diff" });
				close();
			},
		},
		{
			id: "paste-bin",
			label: "Paste Bin",
			group: "commands",
			icon: CreditCard,
			shortcut: "⌘B",
			run: ({ close }) => {
				navigate({ to: "/paste-bin" });
				close();
			},
		},
		{
			id: "chats",
			label: "AI Chat",
			group: "commands",
			icon: Settings,
			shortcut: "⌘S",
			run: ({ close }) => {
				navigate({ to: "/chats" });
				close();
			},
		},
		{
			id: "settings",
			label: "Settings",
			group: "commands",
			icon: Settings,
			shortcut: "⌘S",
			run: ({ close }) => {
				setShowSettings(true);
				close();
			},
		},
	];

	const suggestions = COMMANDS.filter((c) => c.group === "suggestions");
	const commands = COMMANDS.filter((c) => c.group === "commands");

	return (
		<>
			<div
				className="flex w-auto flex-none"
				onClick={() => setOpen(!open)}>
				<button
					type="button"
					aria-haspopup="dialog"
					aria-expanded="false"
					className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-clip-padding text-sm font-medium whitespace-nowrap transition-shadow outline-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 border-border bg-background shadow-xs not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] dark:bg-input/32 dark:not-in-data-[slot=group]:bg-clip-border dark:not-disabled:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/4%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/8%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:bg-accent/50 dark:[:hover,[data-pressed]]:bg-input/64 min-h-8 px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] hover:bg-accent">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width={24}
						height={24}
						viewBox="0 0 24 24"
						fill="none"
						strokeWidth={2}
						stroke="currentColor">
						<path
							d="M17 17L21 21"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
						/>
						<path
							d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
						/>
					</svg>

					<div className="gap-1 sm:flex">
						<kbd className="pointer-events-none flex h-5 items-center justify-center gap-1 rounded border bg-background px-1 font-sans text-[0.7rem] font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3">
							Ctrl
						</kbd>
						<kbd className="pointer-events-none flex h-5 items-center justify-center gap-1 rounded border bg-background px-1 font-sans text-[0.7rem] font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3 aspect-square">
							K
						</kbd>
					</div>
				</button>
			</div>

			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command className="rounded-lg border shadow-md md:min-w-[450px]">
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>
							No results found.
						</CommandEmpty>

						<CommandGroup heading="Suggestions">
							{suggestions.map((cmd) => {
								const Icon = cmd.icon;
								return (
									<CommandItem
										key={cmd.id}
										disabled={
											cmd.disabled
										}
										onSelect={() =>
											cmd.run(ctx)
										}>
										{Icon && <Icon />}
										<span>
											{cmd.label}
										</span>
									</CommandItem>
								);
							})}
						</CommandGroup>

						<CommandSeparator />

						<CommandGroup heading="Commands">
							{commands.map((cmd) => {
								const Icon = cmd.icon;
								return (
									<CommandItem
										key={cmd.id}
										onSelect={() =>
											cmd.run(ctx)
										}>
										{Icon && <Icon />}
										<span>
											{cmd.label}
										</span>
										{cmd.shortcut && (
											<CommandShortcut>
												{
													cmd.shortcut
												}
											</CommandShortcut>
										)}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>

			<SettingsDialog
				open={showSettings}
				onOpenChange={setShowSettings}
			/>
		</>
	);
}
