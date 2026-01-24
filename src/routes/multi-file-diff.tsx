import { EditorPanel } from "@/components/editor-panel";
import { MultiFileDiff } from "@/components/multi-file-diff";
import AppNavbar from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { filePicker } from "@/lib/fns/utils";
import { createFileRoute } from "@tanstack/react-router";
import { Undo2 } from "lucide-react";
import { Activity, useState } from "react";

export const Route = createFileRoute("/multi-file-diff")({
	component: RouteComponent,
});

function RouteComponent() {
	const [showDiff, setShowDiff] = useState(false);
	const [oldFile, setOldFile] = useState<string>("");
	const [newFile, setNewFile] = useState<string>("");

	return (
		<>
			<AppNavbar />

			<Activity mode={showDiff ? "hidden" : "visible"}>
				<div className="grid grid-cols-2 p-2.5 gap-x-2.5 space-y-2.5">
					<EditorPanel
						title="Original Text"
						value={oldFile}
						onChange={(value) => setOldFile(value)}
						onFilePick={async () => {
							const file = await filePicker();
							if (!file) return;

							setOldFile(file.contents);
						}}
					/>

					<EditorPanel
						title="Changed Text"
						value={newFile}
						onChange={(value) => setNewFile(value)}
						onFilePick={async () => {
							const file = await filePicker();

							if (!file) return;

							setNewFile(file.contents);
						}}
					/>
				</div>
				<div className="flex items-center mt-5">
					<div className="mx-auto">
						<Button
							disabled={!oldFile || !newFile}
							onClick={() => setShowDiff(!showDiff)}
							className="bg-green-600 hover:bg-green-700">
							Maximize
						</Button>
					</div>
				</div>
			</Activity>

			<div className="p-2.5">
				<Activity mode={showDiff ? "visible" : "hidden"}>
					<div className="flex items-center mb-2.5">
						<div className="ml-auto">
							<Button
								variant="outline"
								onClick={() =>
									setShowDiff(!showDiff)
								}
								size="sm"
								className="flex items-center font-sans text-sm gap-x-2.5 cursor-pointer">
								<Undo2 className="size-4" />
								Minimize
							</Button>
						</div>
					</div>
				</Activity>

				{oldFile && newFile && (
					<MultiFileDiff
						oldFile={oldFile}
						newFile={newFile}
					/>
				)}
			</div>
		</>
	);
}
