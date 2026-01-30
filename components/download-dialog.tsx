import { Spinner } from "@/components/spinner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { UseDownloadValue } from "@/hooks/use-download";

interface DownloadDialogProps extends UseDownloadValue {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const DownloadDialog = ({
	open,
	onOpenChange,
	isDone,
	currentDownload,
	isDownloading,
	downloadedFiles,
}: DownloadDialogProps) => {
	// const {
	// 	channel,
	// 	isDone,
	// 	currentDownload,
	// 	isDownloading,
	// 	downloadedFiles,
	// } = useDownload();
	// const {
	// 	trigger,
	// 	downloadedFiles,
	// 	currentDownload,
	// 	isDownloading,
	// 	isDone,
	// } = useDownloadChannel();

	// const trigger = async () => {
	// 	await invoke("download", {
	// 		url: "https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri-schema-generator/schemas/config.schema.json",
	// 		channel,
	// 	});
	// };

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				{/* <Button>Dialog</Button> */}
				<p className="sr-only"></p>
				{/* {children} */}
			</DialogTrigger>

			<DialogContent className="max-w-2xl p-2 py-2.5">
				<DialogHeader>
					<DialogTitle>Download</DialogTitle>
				</DialogHeader>

				<div className="rounded-sm bg-accent/50 p-2 font-mono text-sm select-none space-y-1">
					{/* Downloaded files */}
					<div>
						<span className="text-green-300x">
							Downloaded files:
						</span>
					</div>

					{downloadedFiles.length === 0 && (
						<div className="text-muted-foreground">
							- none downloaded
						</div>
					)}

					{downloadedFiles.map((file) => (
						<div key={file.file_path}>
							✔ Downloaded {file.file_name} at{" "}
							{file.file_path}
						</div>
					))}

					{/* Current download */}
					{currentDownload && (
						<div className="flex items-center gap-2">
							<Spinner className="h-4 w-4" />
							<span>
								Downloading{" "}
								{currentDownload.file_name}{" "}
								progress at{" "}
								{currentDownload.total
									? Math.floor(
											(currentDownload.downloaded /
												currentDownload.total) *
												100,
										)
									: "?"}
								%
							</span>
						</div>
					)}

					{/* Done */}
					{isDone && <div>✔ All downloads completed</div>}

					{/* Idle */}
					{!isDownloading && !isDone && (
						<div className="text-muted-foreground">
							Waiting for download to start…
						</div>
					)}
				</div>

				{/* <DialogFooter>
					<Button onClick={trigger}>Start Download</Button>
				</DialogFooter> */}
			</DialogContent>
		</Dialog>
	);
};
