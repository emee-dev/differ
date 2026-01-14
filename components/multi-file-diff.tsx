import { useTheme } from "@/components/theme-provider";
import { MultiFileDiff as _MultiFileDiff } from "@pierre/diffs/react";

export function MultiFileDiff({
	oldFile,
	newFile,
}: {
	oldFile: string;
	newFile: string;
}) {
	const { theme } = useTheme();
	return (
		<_MultiFileDiff
			oldFile={{ name: "main.tsx", contents: oldFile }}
			newFile={{ name: "main.tsx", contents: newFile }}
			options={{
				theme:
					theme === "dark"
						? "github-dark-default"
						: "catppuccin-latte",
				disableFileHeader: true,
			}}
			style={
				{
					"--diffs-font-family": "var(--font-jetbrains)",
					"--diffs-font-size": "13px",
				} as React.CSSProperties
			}
		/>
	);
}
