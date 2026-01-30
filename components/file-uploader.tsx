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
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, FileTextIcon, SaveIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type PasteHistory = {
	id: string;
	body: string;
	isLocal?: boolean;
	date: string;
};

export const RecentPastes = (props: { className?: string }) => {
	const [toggleRecentDialog, setToggleRecentDialog] = useState(false);
	const { data: remotePastes, error } = useConvexQuery(
		"fns:get_recent_pastes",
	);

	const { data: localPastes } = useQueryLocalPastes();

	useEffect(() => {
		if (!error) return;

		toast.error("Unable to fetch recent pastes", {
			description:
				"Recent pastes could not be retrieved. Please restart the app if the issue persists.",
		});

		console.error("Failed to fetch recent pastes:", error);
	}, [error]);

	return (
		<Dialog
			open={toggleRecentDialog}
			onOpenChange={setToggleRecentDialog}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={cn(props.className)}>
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
					{!remotePastes && !localPastes && (
						<div className="h-28 flex flex-col items-center justify-center text-center px-4">
							<p className="text-sm font-medium">
								Nothing here yet
							</p>
							<p className="text-sm text-muted-foreground mt-1 max-w-xs">
								When items are added, they’ll
								show up here.
							</p>
						</div>
					)}

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
	const navigate = useNavigate();
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
				<Button
					aria-label="Open paste"
					size="icon"
					variant="ghost"
					className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
					onClick={() => {
						navigate({
							to: "/pastebin/$pasteId",
							params: {
								pasteId: file.id,
							},
						});
					}}>
					<ExternalLink className="size-4" />
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

	const createdAt = new Date(Math.floor(file._creationTime)).toLocaleString(
		"en-US",
		{
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		},
	);

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
						{createdAt}
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
