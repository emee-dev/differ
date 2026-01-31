import { EditorPanel } from "@/components/editor-panel";
import { RecentPastes } from "@/components/file-uploader";
import AppNavbar from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/hooks/use-file-upload";
import { useQueryPasteById } from "@/hooks/use-pastebin";
import { LocalAttachment } from "@/lib/ipc/pastebin";
import { getLocalFileIcon } from "@/lib/utils";
import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { ExternalLink, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/pastebin/$pasteId")({
	component: RouteComponent,
});

function RouteComponent() {
	const [value, setValue] = useState<string>("");
	const { pasteId } = useParams({ from: "/pastebin/$pasteId" });
	const { data } = useQueryPasteById(pasteId);

	useEffect(() => {
		if (data) {
			setValue(data.body);
		}
	}, [data]);

	return (
		<>
			<AppNavbar />
			<div className="grid grid-cols-3 p-2.5 gap-x-2.5 space-y-2.5">
				<EditorPanel
					className="col-span-2"
					readOnly
					value={value}
					onChange={(value) => setValue(value)}
					customHeader={
						<div className="font-sans text-sm flex items-center">
							<span>Local pastes</span>
						</div>
					}
				/>

				<Attachments attachments={data?.attachments} />
			</div>
		</>
	);
}

export function Attachments({
	attachments,
}: {
	attachments?: LocalAttachment[];
}) {
	const navigate = useNavigate();
	const onDeleteLocalAttachment = (id: string) => {};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center">
				<RecentPastes className="ml-autox" />
				<Button
					variant="outline"
					size="sm"
					className="ml-auto"
					onClick={() => navigate({ to: "/pastebin" })}>
					New paste
				</Button>
			</div>

			<div className="overflow-auto max-h-64 min-h-63 scrollbar-hide">
				{!attachments && (
					<div className="h-28 flex flex-col items-center justify-center text-center px-4">
						<p className="text-sm font-medium">
							Nothing here yet
						</p>
						<p className="text-sm text-muted-foreground mt-1 max-w-xs">
							No attachments were included in this
							paste.
						</p>
					</div>
				)}
				{attachments && attachments.length > 0 && (
					<div className="space-y-2">
						{attachments.map((file) => (
							<div
								className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3"
								key={file.path_on_disk}>
								<div className="flex items-center gap-3 overflow-hidden">
									<div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
										{getLocalFileIcon({
											type: file.original_file_name,
											name: file.original_file_name,
										})}
									</div>
									<div className="flex min-w-0 flex-col gap-0.5">
										<p className="truncate font-medium text-[13px]">
											{
												file.original_file_name
											}
										</p>
										<p className="text-muted-foreground text-xs">
											{formatBytes(
												file.original_file_size,
											)}
										</p>
									</div>
								</div>

								<div className="flex flex-nowrap items-center shrink-0 -me-2">
									<Button
										aria-label="Remove file"
										className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
										onClick={() =>
											onDeleteLocalAttachment(
												file.path_on_disk,
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
										aria-label="Open"
										className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
										onClick={() => {
											console.log(
												"File: ",
												file,
											);
										}}
										size="icon"
										variant="ghost">
										<ExternalLink
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
		</div>
	);
}
