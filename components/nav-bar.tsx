import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Maximize, Minus, Moon, Sun, X } from "lucide-react";
import { CommandMenu } from "./command";

const AppNavbar = (props: { className?: string }) => {
	const appWindow = getCurrentWindow();
	const { theme, setTheme } = useTheme();

	const toggleTheme = (): void => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<header
			data-tauri-drag-region
			className={cn(
				"fixedx top-0 left-0 z-50 h-10 w-full",
				"grid grid-cols-[10rem_1fr_auto_1fr_auto]",
				"items-center pl-2",
				"bg-background border-b",
				props.className,
			)}>
			<div className="flex items-center w-fit gap-2">
				<span className="text-sm">DIFFER</span>
			</div>

			{/* DRAG SPACER (LEFT) */}
			<div />

			<div className="flex justify-center items-center gap-x-2.5">
				<div className="flex items-center gap-x-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="size-4">
						<path
							fillRule="evenodd"
							d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z"
							clipRule="evenodd"
						/>
					</svg>

					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="size-4">
						<path
							fillRule="evenodd"
							d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z"
							clipRule="evenodd"
						/>
					</svg>
				</div>

				<CommandMenu />
			</div>

			{/* DRAG SPACER (RIGHT) */}
			<div />

			<div className="flex items-center justify-end gap-2">
				<Button
					variant="ghost"
					size="icon"
					onClick={toggleTheme}
					aria-label="Toggle theme"
					className="rounded-full">
					<Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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
		</header>
	);
};

export default AppNavbar;
