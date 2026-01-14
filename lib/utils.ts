import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const filePicker = async () => {
	const file_path = await open({
		multiple: false,
		directory: false,
	});

	if (!file_path) return null;

	const data = (await invoke("read_file", { file_path })) as {
		name: string;
		contents: string;
	};

	return data;
};
