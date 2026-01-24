import { CmdMenu } from "@/components/cmd-menu";
import AppNavbar from "@/components/nav-bar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<AppNavbar className="fixed" />
			<div className="h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center scrollbar-hide">
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight">
						Differ
					</h1>
					<p className="text-muted-foreground max-w-md mx-auto">
						A lightweight developer utility for AI
						chats, diffing files, sharing text across
						devices, and managing your clipboard.
					</p>
				</div>

				<p className="text-xs text-muted-foreground">
					Press{" "}
					<kbd className="rounded border px-1">Ctrl</kbd> +{" "}
					<kbd className="rounded border px-1">K</kbd> to
					open commands
				</p>

				<CmdMenu />
			</div>
		</>
	);
}
