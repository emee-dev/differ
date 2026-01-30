import { getCurrentWindow as _tauriCurrentWindow } from "@tauri-apps/api/window";
import { UIMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import {
	FileArchiveIcon,
	FileIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	HeadphonesIcon,
	ImageIcon,
	VideoIcon,
} from "lucide-react";
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

export const getFileIcon = (file: {
	file: File | { type: string; name: string };
}) => {
	const fileType =
		file.file instanceof File ? file.file.type : file.file.type;
	const fileName =
		file.file instanceof File ? file.file.name : file.file.name;

	return getLocalFileIcon({ type: fileType, name: fileName });
};

export const getLocalFileIcon = (file: { type: string; name: string }) => {
	const fileType = file.type;
	const fileName = file.name;

	if (
		fileType.includes("pdf") ||
		fileName.endsWith(".pdf") ||
		fileType.includes("word") ||
		fileName.endsWith(".doc") ||
		fileName.endsWith(".docx")
	) {
		return <FileTextIcon className="size-4 opacity-60" />;
	}
	if (
		fileType.includes("zip") ||
		fileType.includes("archive") ||
		fileName.endsWith(".zip") ||
		fileName.endsWith(".rar")
	) {
		return <FileArchiveIcon className="size-4 opacity-60" />;
	}
	if (
		fileType.includes("excel") ||
		fileName.endsWith(".xls") ||
		fileName.endsWith(".xlsx")
	) {
		return <FileSpreadsheetIcon className="size-4 opacity-60" />;
	}
	if (fileType.includes("video/")) {
		return <VideoIcon className="size-4 opacity-60" />;
	}
	if (fileType.includes("audio/")) {
		return <HeadphonesIcon className="size-4 opacity-60" />;
	}
	if (fileType.startsWith("image/")) {
		return <ImageIcon className="size-4 opacity-60" />;
	}
	return <FileIcon className="size-4 opacity-60" />;
};
