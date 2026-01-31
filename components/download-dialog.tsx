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
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<p className="sr-only"></p>
			</DialogTrigger>

			<DialogContent className="max-w-2xl p-2 py-2.5">
				<DialogHeader>
					<DialogTitle>Download</DialogTitle>
				</DialogHeader>

				<div className="rounded-sm bg-accent/50 p-2 font-mono text-sm select-none space-y-1">
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

					{isDone && <div>✔ All downloads completed</div>}

					{!isDownloading && !isDone && (
						<div className="text-muted-foreground">
							Waiting for download to start…
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
