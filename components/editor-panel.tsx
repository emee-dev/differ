import { CodeEditor } from "@/components/code-editor";
import { useCodemirror } from "@/hooks/use-codemirror";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type EditorPanelProps = {
	title?: string;
	value: string;
	onChange: (value: string) => void;
	onFilePick?: () => Promise<void>;
	className?: string;
	customHeader?: ReactNode;
};

export const EditorPanel = ({
	title,
	value,
	onChange,
	onFilePick,
	className,
	customHeader = null,
}: EditorPanelProps) => {
	const { ref, editorRef } = useCodemirror({ value, onChange });

	return (
		<div
			className={cn(
				"h-125 border rounded-md flex flex-col overflow-hiddenx",
				className,
			)}
			onClick={() => {
				const editor = editorRef.current!;

				if (!editor.hasFocus) {
					editor.focus();
				}
			}}>
			<div className="shrink-0 sticky top-0 z-10 bg-background border-b px-2 py-1.5">
				{!customHeader ? (
					<div className="font-sans text-sm flex items-center">
						<span>{title}</span>

						<button
							type="button"
							className="ml-auto flex items-center gap-x-1.5 text-muted-foreground hover:text-foreground transition"
							onClick={() => onFilePick?.()}>
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
							Pick file
						</button>
					</div>
				) : (
					customHeader
				)}
			</div>

			<div className="flex-1 overflow-auto scrollbar-hide">
				<CodeEditor ref={ref} />
			</div>
		</div>
	);
};
