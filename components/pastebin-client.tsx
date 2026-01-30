import { EditorPanel } from "@/components/editor-panel";
import { getFileIcon } from "@/components/file-uploader";
import { Badge } from "@/components/ui/badge";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useBrowserId } from "@/hooks/use-browser-id";
import {
	FileUploadActions,
	FileUploadState,
	formatBytes,
	useFileUpload,
} from "@/hooks/use-file-upload";
import axios from "axios";
import { useMutation, useQuery } from "convex/react";
import {
	AlertCircleIcon,
	FileTextIcon,
	Loader,
	Settings,
	Smartphone,
	Trash2,
	TrashIcon,
	TriangleAlert,
	Upload,
	XIcon,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

const maxSize = 10 * 1024 * 1024; // 10MB default
const maxFiles = 5;

export function PastebinClient() {
	const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
	const { data: browserId, isLoading } = useBrowserId();
	const account = useQuery(
		api.pastebin_client.getAccount,
		browserId ? { browserId } : "skip",
	) as Account | null;
	const history = useQuery(
		api.pastebin_client.recentHistory,
		account
			? {
					accountId: account.account._id,
					appId: account.account.appId,
				}
			: "skip",
	);

	const [toggleDevices, setToggleDevices] = useState(false);
	const [toggleHistory, setToggleHistory] = useState(false);
	const storePaste = useMutation(api.pastebin_client.savePaste);
	const [toggleConnect, setToggleConnect] = useState(false);
	const [value, setValue] = useState<string>("");
	const [uploadState, uploadActions] = useFileUpload({
		initialFiles: [],
		maxFiles,
		maxSize,
		multiple: true,
	});

	const onSave = async () => {
		const files = uploadState.files
			.map((item) =>
				item.file instanceof File ? item.file : undefined,
			)
			.filter(Boolean) as File[];

		if (!account) return;

		const pasteId = await storePaste({
			body: value,
			accountId: account.account._id,
			appId: account.account.appId,
		});

		if (files.length === 0) return;

		for (const file of files) {
			const postUrl = new URL(`${convexSiteUrl}/uploadFile`);
			postUrl.searchParams.set("pasteid", pasteId);
			postUrl.searchParams.set("filename", file.name);
			postUrl.searchParams.set("filesize", file.size.toString());

			const { error } = await uploadFile(postUrl.toString(), file);

			if (axios.isAxiosError(error)) {
				toast.message(`Failed to upload ${file.name}`, {
					description: error.message,
					action: (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => {}}
							className="ml-auto">
							Retry
						</Button>
					),
				});
				continue;
			}

			toast.message(`${file.name} uploaded successfully`, {});
		}
	};

	return (
		<div className="grid grid-cols-3 p-2.5 gap-x-2.5 space-y-2.5">
			<EditorPanel
				className="col-span-3 rounded-none border-none"
				value={value}
				onChange={(value) => setValue(value)}
				customHeader={
					<div className="font-sans text-sm flex items-center">
						<input
							{...uploadActions.getInputProps()}
							aria-label="Upload files"
							className="sr-only"
						/>
						<span className="text-sm">PASTEBIN</span>

						<div className="ml-auto flex items-center gap-x-3.5">
							{(account === undefined ||
								isLoading) && (
								<div className="flex items-center gap-x-1.5 pb-1 h-9">
									<Loader className="animate-spin duration-150 size-4" />
									Loading
								</div>
							)}

							{account === null && (
								<ConnectDevice
									open={toggleConnect}
									onOpenChange={
										setToggleConnect
									}
									browserId={browserId}
								/>
							)}

							<ShowDevices
								open={toggleDevices}
								onOpenChange={setToggleDevices}
								browserId={browserId}
								devices={account?.devices || []}
							/>

							<PasteHistory
								history={history}
								open={toggleHistory}
								onOpenChange={setToggleHistory}
							/>

							{account && (
								<>
									<FileList
										uploadState={
											uploadState
										}
										uploadActions={
											uploadActions
										}>
										<Button
											variant="outline"
											size="sm"
											className="relative">
											Files
											{uploadState
												.files
												.length >
												0 && (
												<Badge className="-top-2 -translate-x-1/2 absolute left-full min-w-5 px-1">
													{uploadState
														.files
														.length >
													99
														? "99+"
														: uploadState
																.files
																.length}
												</Badge>
											)}
										</Button>
									</FileList>
									<Button
										variant="outline"
										size="icon-sm"
										title="Attachments"
										className="flex items-center gap-x-1.5 transition"
										onClick={() => {
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
									</Button>

									<div className="-space-x-px inline-flex rounded-md shadow-xs rtl:space-x-reverse">
										<Button
											className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
											variant="outline"
											size="sm"
											onClick={
												onSave
											}>
											Save
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger
												asChild>
												<Button
													className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
													size="icon-sm"
													variant="outline">
													<Settings
														aria-hidden="true"
														size={
															16
														}
													/>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												className="w-40"
												align="start">
												<DropdownMenuGroup>
													<DropdownMenuLabel>
														My
														Account
													</DropdownMenuLabel>
													<DropdownMenuItem
														onClick={() => {
															setToggleHistory(
																!toggleHistory,
															);
														}}>
														History
														<DropdownMenuShortcut>
															⇧⌘P
														</DropdownMenuShortcut>
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															setToggleDevices(
																!toggleDevices,
															)
														}>
														Devices
														<DropdownMenuShortcut>
															⌘B
														</DropdownMenuShortcut>
													</DropdownMenuItem>
												</DropdownMenuGroup>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</>
							)}
						</div>
					</div>
				}
			/>
		</div>
	);
}

const FileList = ({
	uploadState: { files, errors },
	uploadActions: { removeFile },
	children,
}: FileListProps) => {
	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-106.25 p-3x py-3 px-1">
				<DialogHeader className="px-1.5">
					<DialogTitle>Attachments</DialogTitle>
					<DialogDescription>
						A list of all your files
					</DialogDescription>
				</DialogHeader>

				{errors.length > 0 && (
					<div
						className="flex items-center gap-1 text-destructive text-xs"
						role="alert">
						<AlertCircleIcon className="size-3 shrink-0" />
						<span>{errors[0]}</span>
					</div>
				)}

				<div className="overflow-auto max-h-64 thin-scrollbar min-h-63 px-1.5">
					{files.length === 0 && (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<Smartphone className="h-12 w-12 text-muted-foreground/40 mb-3" />
							<p className="text-sm text-muted-foreground">
								No attachments at the moment.
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Use the file picker
							</p>
						</div>
					)}

					{files.length > 0 && (
						<div className="space-y-2">
							{files.map((file) => (
								<div
									key={file.id}
									className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3">
									<div className="flex items-center gap-3 min-w-0">
										<div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
											{getFileIcon(
												file,
											)}
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

									<div className="-me-2 flex items-center gap-x-px">
										<Button
											aria-label="Remove file"
											className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
											onClick={() =>
												removeFile(
													file.id,
												)
											}
											size="icon"
											variant="ghost">
											<XIcon
												aria-hidden="true"
												className="size-4"
											/>
										</Button>
										<Button
											aria-label="Remove file"
											className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
											onClick={() =>
												removeFile(
													file.id,
												)
											}
											size="icon"
											variant="ghost">
											<Upload
												aria-hidden="true"
												className="size-4"
											/>
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

const PasteHistory = ({ history = [], open, onOpenChange }: HistoryProps) => {
	const deletePaste = useMutation(api.pastebin_client.deletePaste);

	const onDelete = (pasteId: string) => {
		deletePaste({
			pasteId,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<span className="sr-only"></span>
			</DialogTrigger>
			<DialogContent className="sm:max-w-106.25 p-3x py-3 px-1">
				<DialogHeader className="px-1.5">
					<DialogTitle>History</DialogTitle>
					<DialogDescription>
						A list of all your recent paste history
					</DialogDescription>
				</DialogHeader>

				<div className="overflow-auto max-h-64 thin-scrollbar min-h-63 px-1.5">
					{history.length === 0 && (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<Smartphone className="h-12 w-12 text-muted-foreground/40 mb-3" />
							<p className="text-sm text-muted-foreground">
								No devices connected yet.
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Connect a device from the
								Configuration tab.
							</p>
						</div>
					)}
					{history && history.length > 0 && (
						<div className="space-y-2">
							{history.map((paste) => (
								<div
									key={paste._id}
									className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3">
									<div className="flex items-center gap-3 min-w-0">
										<div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
											<FileTextIcon className="size-4 opacity-60" />
										</div>

										<div className="flex min-w-0 flex-col gap-0.5">
											<div className="flex items-center gap-1 min-w-0">
												<p className="truncate text-[13px] font-medium">
													{
														paste.body
													}
												</p>
											</div>

											<p className="text-xs text-muted-foreground">
												{
													paste._creationTime
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
												onDelete(
													paste._id,
												)
											}>
											<TrashIcon className="size-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

const ConnectDevice = ({
	open,
	onOpenChange,
	browserId,
}: ConnectDeviceProps) => {
	const [appId, setAppId] = useState("");
	const [label, setLabel] = useState("");
	const connectDevice = useMutation(api.pastebin_client.createAccount);

	const onCreateAccount = () => {
		if (!appId || !label) {
			console.log("Enter all required details");
			return;
		}

		connectDevice({
			appId,
			label,
			browserId,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<TriangleAlert className="text-destructive" />
					Connect device
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-120 p-4">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Settings
					</DialogTitle>
					<DialogDescription>
						Configure your pastebin and manage devices.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					<div className="space-y-6">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="appId">
									App ID
								</Label>
								<Input
									id="appId"
									type="text"
									placeholder="Enter your app ID"
									value={appId}
									onChange={(e) =>
										setAppId(
											e.target
												.value,
										)
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="device-label">
									Device label
								</Label>
								<Input
									id="device-label"
									type="text"
									placeholder="Eg work device"
									value={label}
									onChange={(e) =>
										setLabel(
											e.target
												.value,
										)
									}
								/>
							</div>
						</div>

						<Button
							className="w-full"
							disabled={!appId || !label}
							onClick={() => onCreateAccount()}>
							Connect Device
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const ShowDevices = ({
	open,
	onOpenChange,
	devices = [],
	browserId: currentBrowserId,
}: ShowDevicesProps) => {
	const [selectedDevice, setSelectedDevice] = useState<string>("");
	const removeDevice = useMutation(api.pastebin_client.removeDevice);

	useEffect(() => {
		if (currentBrowserId) {
			setSelectedDevice(currentBrowserId);
		}
	}, [currentBrowserId]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<span className="sr-only"></span>
			</DialogTrigger>
			<DialogContent className="sm:max-w-120 p-4">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Settings
					</DialogTitle>
					<DialogDescription>
						Configure your pastebin and manage devices.
					</DialogDescription>
				</DialogHeader>

				{devices.length === 0 && (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<Smartphone className="h-12 w-12 text-muted-foreground/40 mb-3" />
						<p className="text-sm text-muted-foreground">
							No devices connected yet.
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Connect a device from the
							Configuration tab.
						</p>
					</div>
				)}

				{devices.length > 0 && (
					<div className="space-y-4">
						<div className="space-y-2.5">
							<Label>Select Device</Label>
							<Select
								value={selectedDevice}
								onValueChange={
									setSelectedDevice
								}>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{devices.map((device) => (
										<SelectItem
											key={
												device.browserId
											}
											value={
												device.browserId
											}>
											<div className="flex items-center gap-2">
												<Smartphone className="h-4 w-4" />
												<span>
													{
														device.label
													}
												</span>
												{device.browserId ===
													currentBrowserId && (
													<span className="text-xs text-success">
														(current)
													</span>
												)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{selectedDevice && (
							<div className="p-4 rounded-lg border bg-card space-y-3">
								<div className="flex items-start justify-between">
									<div>
										<p className="font-medium">
											{
												devices.find(
													(
														d,
													) =>
														d.browserId ===
														selectedDevice,
												)?.label
											}
										</p>
										<p className="text-xs text-muted-foreground font-mono mt-1">
											{
												selectedDevice
											}
										</p>
									</div>
									{selectedDevice ===
										currentBrowserId && (
										<span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
											Current
										</span>
									)}
								</div>

								<Button
									variant="destructive"
									size="sm"
									className="w-full"
									onClick={() => {
										const currentDevice =
											devices.find(
												(i) =>
													i.browserId ===
													selectedDevice,
											);

										if (!currentDevice)
											return;

										removeDevice?.({
											deviceId: currentDevice._id as Id<"devices">,
										});
									}}
									disabled={
										selectedDevice ===
										currentBrowserId
									}>
									<Trash2 className="h-4 w-4 mr-2" />
									Remove Device
								</Button>
							</div>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export const uploadFile = async (postUrl: string, file: File) => {
	try {
		const buffer: ArrayBuffer = await file.arrayBuffer();

		await axios.post(postUrl, buffer, {
			headers: {
				"Content-Type": "application/octet-stream",
			},
		});

		return {
			error: null,
		};
	} catch (error) {
		return {
			error: error,
		};
	}
};

type History = {
	_id: Id<"pastebins">;
	_creationTime: number;
	accountId: Id<"accounts">;
	appId: string;
	body: string;
};

type Account = {
	account: {
		_id: string;
		_creationTime: number;
		appId: string;
		password: string;
	};
	devices: {
		_id: string;
		_creationTime: number;
		accountId: string;
		label: string;
		browserId: string;
	}[];
};

type FileListProps = {
	uploadState: FileUploadState;
	uploadActions: FileUploadActions;
	children: ReactNode;
};

type HistoryProps = {
	history: History[] | undefined;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

type Devices = Account["devices"][number];

interface ConnectDeviceProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	browserId: string;
}

interface ShowDevicesProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	devices?: Devices[];
	browserId: string;
}
