"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	FileUploadActions,
	FileUploadState,
	formatBytes,
} from "@/hooks/use-file-upload";
import {
	AlertCircleIcon,
	FileArchiveIcon,
	FileIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	FileUpIcon,
	HeadphonesIcon,
	ImageIcon,
	SaveIcon,
	TrashIcon,
	VideoIcon,
	XIcon,
} from "lucide-react";

export type PasteHistory = {
	id: string;
	body: string;
	isLocal?: boolean;
	date: string;
};

const getFileIcon = (file: { file: File | { type: string; name: string } }) => {
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

export function FileUploader({
	pasteHistory,
	uploadState: { files, isDragging, errors },
	uploadActions: {
		handleDragEnter,
		handleDragLeave,
		handleDragOver,
		handleDrop,
		openFileDialog,
		removeFile,
		clearFiles,
		getInputProps,
	},
}: {
	pasteHistory: PasteHistory[];
	uploadState: FileUploadState;
	uploadActions: FileUploadActions;
}) {
	const maxSize = 100 * 1024 * 1024; // 10MB default
	const maxFiles = 10;

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center">
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm">
							Recent Pastes
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-106.25 p-3">
						<DialogHeader>
							<DialogTitle>History</DialogTitle>
							<DialogDescription>
								A list of all your recent paste
								history
							</DialogDescription>
						</DialogHeader>

						<div className="overflow-auto max-h-64 scrollbar-hide">
							{pasteHistory.length > 0 && (
								<div className="space-y-2">
									{pasteHistory.map(
										(file) => (
											<div
												key={
													file.id
												}
												className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3">
												<div className="flex items-center gap-3 min-w-0">
													<div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
														<FileTextIcon className="size-4 opacity-60" />
													</div>

													<div className="flex min-w-0 flex-col gap-0.5">
														{/* filename + badge row */}
														<div className="flex items-center gap-1 min-w-0">
															<p className="truncate text-[13px] font-medium">
																{
																	file.body
																}
															</p>

															{file.isLocal !==
																true && (
																<span className="shrink-0 text-xs text-muted-foreground">
																	(Not
																	synced)
																</span>
															)}
														</div>

														<p className="text-xs text-muted-foreground">
															{
																file.date
															}
														</p>
													</div>
												</div>

												<div className="flex flex-nowrap items-center shrink-0 -me-2">
													<Button
														aria-label="Remove file"
														size="icon"
														variant="ghost"
														className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
														onClick={() =>
															removeFile(
																file.id,
															)
														}>
														<TrashIcon className="size-4" />
													</Button>

													{file.isLocal !==
														true && (
														<Button
															aria-label="Save file"
															size="icon"
															variant="ghost"
															className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
															onClick={() =>
																removeFile(
																	file.id,
																)
															}>
															<SaveIcon className="size-4" />
														</Button>
													)}
												</div>
											</div>
										),
									)}
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>

				<Button
					size="sm"
					className="bg-black/80 hover:bg-black/70 ml-auto">
					Save
				</Button>
			</div>

			{/* Drop area */}
			<div
				className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-input border-dashed p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-[input:focus]:border-ring has-disabled:opacity-50 has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50"
				data-dragging={isDragging || undefined}
				onClick={openFileDialog}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				role="button"
				tabIndex={-1}>
				<input
					{...getInputProps()}
					aria-label="Upload files"
					className="sr-only"
				/>

				<div className="flex flex-col items-center justify-center text-center">
					<div
						aria-hidden="true"
						className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background">
						<FileUpIcon className="size-4 opacity-60" />
					</div>
					<p className="mb-1.5 font-medium text-sm">
						Upload files
					</p>
					<p className="mb-2 text-muted-foreground text-xs">
						Drag & drop or click to browse
					</p>
					<div className="flex flex-wrap justify-center gap-1 text-muted-foreground/70 text-xs">
						<span>All files</span>
						<span>∙</span>
						<span>Max {maxFiles} files</span>
						<span>∙</span>
						<span>Up to {formatBytes(maxSize)}</span>
					</div>
				</div>
			</div>

			{errors.length > 0 && (
				<div
					className="flex items-center gap-1 text-destructive text-xs"
					role="alert">
					<AlertCircleIcon className="size-3 shrink-0" />
					<span>{errors[0]}</span>
				</div>
			)}

			<div className="overflow-auto max-h-64 min-h-63 scrollbar-hide">
				{files.length > 0 && (
					<div className="space-y-2">
						{files.map((file) => (
							<div
								className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3"
								key={file.id}>
								<div className="flex items-center gap-3 overflow-hidden">
									<div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
										{getFileIcon(file)}
									</div>
									<div className="flex min-w-0 flex-col gap-0.5">
										<p className="truncate font-medium text-[13px]">
											{file.file instanceof
											File
												? file
														.file
														.name
												: file
														.file
														.name}
										</p>
										<p className="text-muted-foreground text-xs">
											{formatBytes(
												file.file instanceof
													File
													? file
															.file
															.size
													: file
															.file
															.size,
											)}
										</p>
									</div>
								</div>

								<Button
									aria-label="Remove file"
									className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
									onClick={() =>
										removeFile(file.id)
									}
									size="icon"
									variant="ghost">
									<XIcon
										aria-hidden="true"
										className="size-4"
									/>
								</Button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Remove all files button */}
			{files.length > 1 && (
				<div>
					<Button
						onClick={clearFiles}
						size="sm"
						variant="outline">
						Remove all files
					</Button>
				</div>
			)}
		</div>
	);
}
