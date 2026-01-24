import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

type ConvexFunctions = "fns:get_recent_pastes";

type Events = "value" | "convex_error" | "error_message";

export const useConvexQuery = (fn: ConvexFunctions) => {
	const [value, setValue] = useState(undefined);
	const [convex_error, set_convex_error] = useState<string>("");
	const [error_message, set_error_message] = useState<string>("");

	useEffect(() => {
		const value = listen("get_value", (ev) => {
			setValue(ev.payload as any);
		});
		const convexError = listen(`convex_error`, (ev) => {
			set_convex_error(ev.payload as any);
		});
		const errorMessage = listen(`error_message`, (ev) => {
			set_error_message(ev.payload as any);
		});

		return () => {
			value.then((fn) => fn?.());
			convexError.then((fn) => fn?.());
			errorMessage.then((fn) => fn?.());
		};
	}, []);

	return {
		value,
		error: error_message ? error_message : convex_error,
	};
};
