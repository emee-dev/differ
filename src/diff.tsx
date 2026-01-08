import { type FileContents, MultiFileDiff } from "@pierre/diffs/react";
import { invoke } from "@tauri-apps/api/core";
// Store file objects in variables rather than inlining them.
// The React components use reference equality to detect changes
// and skip unnecessary re-renders, so keep these references stable
// (e.g., with useState or useMemo).
const oldFile: FileContents = {
	name: "main.zig",
	contents: `const std = @import("std");
  
  pub fn main() !void {
      const stdout = std.io.getStdOut().writer();
      try stdout.print("Hi you, {s}!\\\\n", .{"world"});
  }
  `,
};

const newFile: FileContents = {
	name: "main.zig",
	contents: `const std = @import("std");
  
  pub fn main() !void {
      const stdout = std.io.getStdOut().writer();
      try stdout.print("Hello there, {s}!\\\\n", .{"zig"});
  }
  `,
};

export function SingleDiff() {
	return (
		<>
			<MultiFileDiff
				// We automatically detect the language based on filename
				oldFile={oldFile}
				newFile={newFile}
				options={{ theme: "pierre-dark" }}
				style={
					{
						"--diffs-font-family":
							"JetBrains Mono, monospace",
						"--diffs-font-size": "13px",
					} as React.CSSProperties
				}
			/>
			<button
				onClick={async () => {
					const r = await invoke("diff_text", {
						oldText: "",
						newText: "",
					});

					console.log(r);

					// diff_text
				}}>
				Click me
			</button>
		</>
	);
}
