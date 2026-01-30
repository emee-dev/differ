import { javascript } from "@codemirror/lang-javascript";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { CSSProperties, useEffect, useRef } from "react";

interface UseCodemirrorProps {
	value?: string;
	onChange?: (src: string) => void;
	readOnly?: boolean;
}

type Styles = Record<string, CSSProperties>;

export const useCodemirror = ({
	value = "",
	onChange,
	readOnly,
}: UseCodemirrorProps) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<EditorView | null>(null);
	const readOnlyCpt = useRef(new Compartment());

	useEffect(() => {
		if (!containerRef.current) return;

		const extensions = [
			readOnlyCpt.current.of(
				EditorView.editable.of(!Boolean(readOnly)),
			),
			basicSetup,
			javascript({
				typescript: true,
			}),
			EditorView.lineWrapping,
			EditorView.updateListener.of((update) => {
				if (update.docChanged && onChange) {
					const src = update.state.doc.toString();
					onChange(src);
				}
			}),
			EditorView.theme({
				"&": { height: "100%" },
				".cm-scroller": {
					overflow: "auto",
					minHeight: "500px",
				},
				".cm-activeLine": {
					backgroundColor: "transparent !important",
				},
				".cm-activeLineGutter": {
					backgroundColor: "transparent",
				},
				"&.cm-editor.cm-focused": {
					outline: "none",
				},
				".cm-line": {
					fontFamily: "var(--font-mono)",
				},
				".cm-content": {
					fontFamily: "var(--font-mono)",
					fontSize: "13px",
				},
				".cm-cursor": {
					border: "1.8px solid var(--color-primary)",
					lineHeight: "3px",
					width: "auto",
					zIndex: 1,
				},
				".cm-gutters": {
					border: "none",
					backgroundColor: "var(--background)",
					fontFamily: "var(--font-mono)",
					fontSize: "12px",
				},
				"&.cm-focused .cm-selectionBackground, ::selection": {
					backgroundColor: "var(--accent)",
					color: "var(--color-primary)",
				},
			} satisfies Styles),
		];

		const state = EditorState.create({
			doc: value,
			extensions,
		});

		const view = new EditorView({
			state,
			parent: containerRef.current,
		});

		editorRef.current = view;

		return () => {
			view.destroy();
		};
	}, []);

	useEffect(() => {
		if (!editorRef.current) return;
		const current = editorRef.current.state.doc.toString();

		if (current !== value) {
			editorRef.current.dispatch({
				changes: {
					from: 0,
					to: current.length,
					insert: value,
				},
			});
		}
	}, [value]);

	useEffect(() => {
		if (!editorRef.current || readOnly === undefined) return;

		editorRef.current.dispatch({
			effects: readOnlyCpt.current.reconfigure(
				EditorView.editable.of(!readOnly),
			),
		});
	}, [readOnly]);

	return { editorRef, ref: containerRef };
};
