import { getCurrentWindow as _tauriCurrentWindow } from "@tauri-apps/api/window";
import { UIMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function sanitizeText(text: string) {
	return text.replace("<has_function_call>", "");
}

export function getTextFromMessage(message: UIMessage): string {
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => (part as { type: "text"; text: string }).text)
		.join("");
}

export const getCurrentWindow = () => {
	if (typeof window !== undefined && (window as any)?.isTauri) {
		return _tauriCurrentWindow();
	} else {
		return {
			minimize() {},
			toggleMaximize() {},
			close() {},
		};
	}
};

export const isTauri = () => {
	return (
		typeof window !== undefined && ((window as any)?.isTauri as boolean)
	);
};
