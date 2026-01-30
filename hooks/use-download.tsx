import { Channel } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

type Started = {
	event: "started";
	data: {
		total_files: number;
	};
};

type Progress = {
	event: "progress";
	data: {
		file_name: string;
		downloaded: number;
		total: number | null;
	};
};

type Finished = {
	event: "finished";
	data: {
		file_path: string;
		file_name: string;
	};
};

type Skipped = {
	event: "skipped";
	data: {
		reason: string;
	};
};

type Done = {
	event: "done";
};

export type DownloadChannel = Channel<DownloadEvent>;

export type DownloadEvent = Started | Progress | Finished | Skipped | Done;

export type UseDownloadValue = {
	isDone: boolean;
	currentDownload: Progress["data"];
	downloadedFiles: Finished["data"][];
	channel: DownloadChannel;
	isDownloading: boolean;
};

export const useDownload = () => {
	const [downloadedFiles, setDownloadedFiles] = useState<
		Finished["data"][]
	>([]);
	const [currentDownload, setCurrentDownload] = useState<
		Progress["data"] | null
	>(null);
	const [isDownloading, setIsDownloading] = useState(false);
	const [isDone, setIsDone] = useState(false);
	const channel = useRef<DownloadChannel | null>(
		new Channel<DownloadEvent>(),
	);

	useEffect(() => {
		if (!channel.current) return;

		channel.current.onmessage = (message) => {
			if (message.event === "started") {
				setCurrentDownload(null);
				setIsDownloading(true);
			}

			if (message.event === "progress") {
				setCurrentDownload(() => message.data);
				setIsDownloading(true);
			}

			if (message.event === "finished") {
				setCurrentDownload(null);
				setDownloadedFiles((p) => [...p, message.data]);
			}

			if (message.event === "done") {
				setIsDone(true);
				setIsDownloading(false);
			}
		};
		return () => {
			channel.current = null;
		};
	}, []);

	return {
		isDone,
		currentDownload,
		downloadedFiles,
		channel: channel.current,
		isDownloading,
	} as UseDownloadValue;
};
