import { Ref } from "react";

type CodeEditorProps = { ref: Ref<HTMLDivElement> };

export function CodeEditor({ ref }: CodeEditorProps) {
	return (
		<div className="overflow-hidden h-fit">
			<div
				ref={ref}
				className="font-mono text-sm h-full min-h-20 max-h-38x overflow-auto"
			/>
		</div>
	);
}
