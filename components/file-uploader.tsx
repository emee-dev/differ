import { DownloadDialog } from "@/components/download-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { useDownload } from "@/hooks/use-download";
import {
	useDeleteLocalPaste,
	useDeleteRemotePaste,
	useQueryLocalPastes,
	useSaveRemotePasteLocally,
} from "@/hooks/use-pastebin";
import { LocalPastes, RemotePastes } from "@/lib/ipc/pastebin";
import {
	FileArchiveIcon,
	FileIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	HeadphonesIcon,
	ImageIcon,
	SaveIcon,
	TrashIcon,
	VideoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type PasteHistory = {
	id: string;
	body: string;
	isLocal?: boolean;
	date: string;
};

export const getFileIcon = (file: {
	file: File | { type: string; name: string };
}) => {
	const fileType =
		file.file instanceof File ? file.file.type : file.file.type;
	const fileName =
		file.file instanceof File ? file.file.name : file.file.name;

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

export const RecentPastes = () => {
	const [toggleRecentDialog, setToggleRecentDialog] = useState(false);
	const { data: remotePastes, error } = useConvexQuery(
		"fns:get_recent_pastes",
	);

	const { data: localPastes } = useQueryLocalPastes();

	useEffect(() => {
		if (!error) return;

		toast.error("Unable to recent pastes", {
			description:
				"Recent pastes could not be retrieved. Please restart the app if the issue persists.",
		});

		console.error("Failed to recent pastes:", error);
	}, [error]);

	return (
		<Dialog
			open={toggleRecentDialog}
			onOpenChange={setToggleRecentDialog}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					Recent Pastes
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-106.25 p-3">
				<DialogHeader>
					<DialogTitle>History</DialogTitle>
					<DialogDescription>
						A list of all your recent paste history
					</DialogDescription>
				</DialogHeader>

				<div className="overflow-auto max-h-64 scrollbar-hide">
					{remotePastes && remotePastes.length > 0 && (
						<div className="space-y-2">
							{remotePastes.map((file) => (
								<RenderRemotePaste
									key={file._id}
									file={file}
									onSave={() =>
										setToggleRecentDialog(
											!toggleRecentDialog,
										)
									}
								/>
							))}
						</div>
					)}

					{localPastes && localPastes.length > 0 && (
						<div className="space-y-2">
							{localPastes.map((file) => (
								<RenderLocalPaste
									key={file.id}
									file={file}
								/>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

const RenderLocalPaste = ({ file }: { file: LocalPastes }) => {
	const { mutate: deleteLocalPaste } = useDeleteLocalPaste();

	return (
		<div
			key={file.id}
			className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3">
			<div className="flex items-center gap-3 min-w-0">
				<div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
					<FileTextIcon className="size-4 opacity-60" />
				</div>

				<div className="flex min-w-0 flex-col gap-0.5">
					{/* filename + badge row */}
					<div className="flex items-center gap-1 min-w-0">
						<p className="truncate text-[13px] font-medium">
							{file.body}
						</p>
					</div>

					<p className="text-xs text-muted-foreground">
						{file.created_at}
					</p>
				</div>
			</div>

			<div className="flex flex-nowrap items-center shrink-0 -me-2">
				<Button
					aria-label="Remove file"
					size="icon"
					variant="ghost"
					className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
					onClick={() => deleteLocalPaste(file.id)}>
					<TrashIcon className="size-4" />
				</Button>
			</div>
		</div>
	);
};

const RenderRemotePaste = ({
	file,
	onSave,
}: {
	file: RemotePastes;
	onSave: () => void;
}) => {
	const [open, setOpen] = useState(false);
	const {
		channel,
		isDone,
		currentDownload,
		isDownloading,
		downloadedFiles,
	} = useDownload();
	const { mutate: deleteRemotePasteById } = useDeleteRemotePaste();
	const { mutate: saveRemotePasteLocally } =
		useSaveRemotePasteLocally(channel);

	return (
		<div
			key={file._id}
			className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3">
			<div className="flex items-center gap-3 min-w-0">
				<div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
					<FileTextIcon className="size-4 opacity-60" />
				</div>

				<div className="flex min-w-0 flex-col gap-0.5">
					{/* filename + badge row */}
					<div className="flex items-center gap-1 min-w-0">
						<p className="truncate text-[13px] font-medium">
							{file.body}
						</p>

						<span className="shrink-0 text-xs text-muted-foreground">
							(Not synced)
						</span>
					</div>

					<p className="text-xs text-muted-foreground">
						{file._creationTime}
					</p>
				</div>
			</div>

			<div className="flex flex-nowrap items-center shrink-0 -me-2">
				<Button
					aria-label="Remove file"
					size="icon"
					variant="ghost"
					className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
					onClick={() => deleteRemotePasteById(file._id)}>
					<TrashIcon className="size-4" />
				</Button>

				<Button
					aria-label="Save file"
					size="icon"
					variant="ghost"
					className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
					onClick={() => {
						// onSave();
						saveRemotePasteLocally({
							_id: file._id,
							body: file.body,
						});
					}}>
					<SaveIcon className="size-4" />
				</Button>

				<DownloadDialog
					channel={channel}
					isDone={isDone}
					isDownloading={isDownloading}
					currentDownload={currentDownload}
					downloadedFiles={downloadedFiles}
					onOpenChange={setOpen}
					open={open}></DownloadDialog>
			</div>
		</div>
	);
};
