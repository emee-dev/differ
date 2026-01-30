import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn, getCurrentWindow } from "@/lib/utils";
import { Maximize, Minus, Moon, Settings, Sun, X } from "lucide-react";
import { ReactNode } from "react";
import { CmdMenu } from "./cmd-menu";
import { Navigation } from "./navigation";
import { SettingsDialog } from "./settings-dialog";
import { useSettingsDialog } from "./settings-provider";

const AppNavbar = ({
	className,
	sidebarTrigger,
	title = true,
}: {
	className?: string;
	sidebarTrigger?: ReactNode;
	title?: boolean;
}) => {
	const appWindow = getCurrentWindow();
	const { theme, setTheme } = useTheme();
	const { toggleDialog } = useSettingsDialog();

	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	const toggleSettings = () => {
		toggleDialog();
	};

	return (
		<header
			data-tauri-drag-region
			className={cn(
				"top-0 left-0 z-50 h-10 w-full",
				"grid grid-cols-[10rem_1fr_auto_1fr_auto]",
				"items-center pl-2",
				"bg-background border-b",
				className,
			)}>
			<div className="flex items-center w-fit gap-2">
				{sidebarTrigger}
				{!!title && <span className="text-sm">DIFFER</span>}
			</div>

			{/* DRAG SPACER (LEFT) */}
			<div />

			<div className="flex justify-center items-center gap-x-2.5">
				<Navigation />
				<CmdMenu />
			</div>

			{/* DRAG SPACER (RIGHT) */}
			<div />

			<div className="flex items-center justify-end gap-2">
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Settings"
					onClick={toggleSettings}
					className="h-8 p-1 md:h-fit md:p-2">
					<Settings />
				</Button>

				<Button
					variant="ghost"
					size="icon-sm"
					onClick={toggleTheme}
					aria-label="Toggle theme"
					className="h-8 p-1 md:h-fit md:p-2">
					<Sun className="h-5x w-5x rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-5x w-5x rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				</Button>

				<div className="flex items-center overflow-hidden">
					<button
						className="h-10 w-11 flex items-center justify-center hover:bg-muted-foreground/50"
						onClick={() => appWindow.minimize()}>
						<Minus className="h-4" />
					</button>

					<button
						className="h-10 w-11 flex items-center justify-center hover:bg-muted-foreground/50"
						onClick={() => appWindow.toggleMaximize()}>
						<Maximize className="h-4" />
					</button>

					<button
						className="h-10 w-11 flex items-center justify-center hover:bg-red-500"
						onClick={() => appWindow.close()}>
						<X className="h-4" />
					</button>
				</div>
			</div>

			<SettingsDialog
			// open={openSettings}
			// onOpenChange={setOpenSettings}
			/>
		</header>
	);
};

export default AppNavbar;
