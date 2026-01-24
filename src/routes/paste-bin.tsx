import { EditorPanel } from "@/components/editor-panel";
import { FileUploader, PasteHistory } from "@/components/file-uploader";
import AppNavbar from "@/components/nav-bar";
import { useFileUpload } from "@/hooks/use-file-upload";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/paste-bin")({
	component: RouteComponent,
});

const pasteHistory: PasteHistory[] = [
	{
		id: "01",
		body: "document is a very long text that should be truncated",
		date: "12-01-2026",
	},
	{
		id: "02",
		body: "document is a ",
		date: "12-01-2026",
	},
	{
		id: "03",
		body: "document is a ",
		isLocal: true,
		date: "12-01-2026",
	},
	{
		id: "04",
		body: "document is a ",
		date: "12-01-2026",
	},
	{
		id: "05",
		body: "document is a ",
		date: "12-01-2026",
	},
	{
		id: "06",
		body: "document is a ",
		isLocal: true,
		date: "12-01-2026",
	},
	{
		id: "07",
		body: "document is a ",
		isLocal: true,
		date: "12-01-2026",
	},
];

const initialFiles = [
	{
		id: "document.pdf-1744638436563-8u5xuls",
		name: "document.pdf",
		size: 528737,
		type: "application/pdf",
		url: "https://example.com/document.pdf",
	},
	{
		id: "intro.zip-1744638436563-8u5xuls",
		name: "intro.zip",
		size: 252873,
		type: "application/zip",
		url: "https://example.com/intro.zip",
	},
	{
		id: "conclusion.xlsx-1744638436563-8u5xuls",
		name: "conclusion.xlsx",
		size: 352873,
		type: "application/xlsx",
		url: "https://example.com/conclusion.xlsx",
	},
];

function RouteComponent() {
	const [value, setValue] = useState<string>("");
	const maxSize = 100 * 1024 * 1024; // 10MB default
	const maxFiles = 10;
	const [uploadState, uploadActions] = useFileUpload({
		initialFiles,
		maxFiles,
		maxSize,
		multiple: true,
	});

	// const l = useListen("getPasteBins");

	// useEffect(() => {
	// 	if (data) {
	// 		console.log("data: ", data);
	// 	}

	// 	if (errorMessage) {
	// 		console.log("errorMessage: ", errorMessage);
	// 	}
	// 	if (convexError) {
	// 		console.log("convexError: ", convexError);
	// 	}
	// }, [data, errorMessage, convexError]);

	return (
		<>
			<AppNavbar />
			<div className="grid grid-cols-3 p-2.5 gap-x-2.5 space-y-2.5">
				<EditorPanel
					className="col-span-2"
					title="Paste text"
					value={value}
					onChange={(value) => setValue(value)}
					customHeader={
						<div className="font-sans text-sm flex items-center">
							<span>Paste text</span>

							<button
								type="button"
								className="ml-auto flex items-center gap-x-1.5 text-muted-foreground hover:text-foreground transition"
								onClick={() =>
									uploadActions.openFileDialog()
								}>
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
					pasteHistory={pasteHistory}
					uploadState={uploadState}
					uploadActions={uploadActions}
				/>
			</div>
		</>
	);
}
