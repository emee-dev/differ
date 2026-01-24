import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ErrorDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	error?: Error | string | null;
}

let stack = `throw new Error("This is going to crash a program");
      ^

Error: This is going to crash a program
    at <anonymous> (C:\Users\DELL\Desktop\differ\abc.ts:1:7)
    at ModuleJob.run (node:internal/modules/esm/module_job:377:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:671:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)`;

export function ErrorDialog({ open, onOpenChange }: ErrorDialogProps) {
	let error = Error("This is an error");
	error.stack = stack;

	const message =
		typeof error === "string" ? error : (error.stack ?? error.message);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-2xl p-0 overflow-hidden w-2xl">
				<DialogHeader className="p-2.5 sr-onlyx">
					<DialogTitle className="text-lg">
						App error
					</DialogTitle>
					<DialogDescription>
						Either reload the app or retry the logic
					</DialogDescription>
				</DialogHeader>

				<div className="flex h-[35vh] w-full">
					<div className="relative">
						<pre className="max-h-[60vh] overflow-auto p-4 font-mono text-xs leading-relaxed text-red-400 whitespace-pre-wrap wrap-break-word">
							{message}
						</pre>
					</div>
				</div>
				<div className="flex items-center p-4">
					<Button>Terminate</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
