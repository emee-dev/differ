import { EditorPanel } from "@/components/editor-panel";
import { RecentPastes } from "@/components/file-uploader";
import AppNavbar from "@/components/nav-bar";
import { uploadFile } from "@/components/pastebin-client";
import { useSettingsDialog } from "@/components/settings-provider";
import { Button } from "@/components/ui/button";
import { useQueryAppConfig } from "@/hooks/use-app-utils";
import {
	FileUploadActions,
	FileUploadState,
	formatBytes,
	useFileUpload,
} from "@/hooks/use-file-upload";
import { useIsSynced, useRemoteSavePaste } from "@/hooks/use-pastebin";
import { useTask } from "@/hooks/use-task";
import { cmd_convex_query } from "@/lib/ipc/pastebin";
import { getFileIcon } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import { AlertCircleIcon, FileUpIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/pastebin/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: config } = useQueryAppConfig();
	const { data, isLoading } = useIsSynced(config?.app_id);
	const { toggleDialog } = useSettingsDialog();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [value, setValue] = useState<string>("");
	const maxSize = 10 * 1024 * 1024; // 10MB default
	const maxFiles = 5;
	const [uploadState, uploadActions] = useFileUpload({
		initialFiles: [],
		maxFiles,
		maxSize,
		multiple: true,
	});

	useTask(async () => {
		const killTask = await cmd_convex_query();
		return () => killTask();
	});

	if (isLoading) {
		return (
			<>
				<AppNavbar />

				<div className="flex min-h-[60vh] items-center justify-center p-4">
					<div className="max-w-md text-center space-y-4">
						<h2 className="text-lg font-semibold">
							Loading page please wait
						</h2>
					</div>
				</div>
			</>
		);
	}

	if (!data || !data.isSynced) {
		return (
			<>
				<AppNavbar />

				<div className="flex min-h-[60vh] items-center justify-center p-4">
					<div className="max-w-md text-center space-y-4">
						<h2 className="text-lg font-semibold">
							Connect your Pastebin
						</h2>

						<p className="text-sm text-muted-foreground">
							To push changes and sync your pastes
							across devices, you need to connect
							this app to the remote server. This is
							a one-time setup.
						</p>

						<Button
							size="lg"
							onClick={() => toggleDialog("paste")}>
							Connect Pastebin
						</Button>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<AppNavbar />
			<div className="grid grid-cols-3 p-2.5 gap-x-2.5 space-y-2.5">
				<EditorPanel
					className="col-span-2"
					title="Paste text"
					value={value}
					readOnly={isSubmitting}
					onChange={(value) => setValue(value)}
					customHeader={
						<div className="font-sans text-sm flex items-center">
							<span>Paste text</span>

							<button
								type="button"
								className="ml-auto flex items-center gap-x-1.5 text-muted-foreground hover:text-foreground transition"
								onClick={() => {
									if (isSubmitting) return;

									uploadActions.openFileDialog();
								}}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									className="size-4">
									<path
										fillRule="evenodd"
										d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
										clipRule="evenodd"
									/>
								</svg>
								Attach file
							</button>
						</div>
					}
				/>

				<FileUploader
					value={value}
					maxSize={maxSize}
					maxFiles={maxFiles}
					appId={config?.app_id}
					uploadState={uploadState}
					uploadActions={uploadActions}
					resetEditor={() => {
						setValue("");
						uploadActions.clearFiles();
					}}
					setIsSubmitting={setIsSubmitting}
				/>
			</div>
		</>
	);
}

export function FileUploader({
	appId,
	value,
	maxSize,
	maxFiles,
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
	resetEditor,
	setIsSubmitting,
}: {
	value: string;
	appId?: string;
	maxFiles: number;
	maxSize: number;
	uploadState: FileUploadState;
	uploadActions: FileUploadActions;
	resetEditor: () => void;
	setIsSubmitting: (s: boolean) => void;
}) {
	const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
	const { mutateAsync: saveRemotePaste } = useRemoteSavePaste();

	const onSave = async () => {
		setIsSubmitting(true);
		const rawFiles = files
			.map((item) =>
				item.file instanceof File ? item.file : undefined,
			)
			.filter(Boolean) as File[];

		if (!appId) {
			setIsSubmitting(false);
			toast.message(`AppId not found`, {});
			return;
		}

		const record = await saveRemotePaste({
			body: value,
			appId,
		});

		resetEditor();

		if (rawFiles.length === 0 || record.pasteId === null) {
			setIsSubmitting(false);
			return;
		}

		for (const file of rawFiles) {
			const postUrl = new URL(`${convexSiteUrl}/uploadFile`);
			postUrl.searchParams.set("pasteid", record.pasteId);
			postUrl.searchParams.set("filename", file.name);
			postUrl.searchParams.set("filesize", file.size.toString());

			const { error } = await uploadFile(postUrl.toString(), file);

			if (axios.isAxiosError(error)) {
				toast.message(`Failed to upload ${file.name}`, {
					description: error.message,
				});
				continue;
			}

			toast.message(`${file.name} uploaded successfully`, {});
		}

		setIsSubmitting(false);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center">
				<RecentPastes />

				<Button
					className="ml-auto"
					size="sm"
					variant="outline"
					onClick={onSave}>
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
						Click to browse
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
