import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

type Fns = "getPasteBins";

type Events = "value" | "convex_error" | "error_message";

export const useListen = (fn: Fns) => {
	const [value, setValue] = useState(undefined);
	const [convexError, setConvexError] = useState(null);
	const [errorMessage, setErrorMessage] = useState(null);

	useEffect(() => {
		const value = listen("get_value", (ev) => {
			console.log("Value: ", ev.payload);
			setValue(ev.payload as any);
		});
		// const convexError = listen(
		// 	`getPasteBins_convex_error` as Fns,
		// 	(ev) => {
		// 		setConvexError(ev.payload as any);
		// 	},
		// );
		// const errorMessage = listen(
		// 	`getPasteBins_error_message` as Fns,
		// 	(ev) => {
		// 		setErrorMessage(ev.payload as any);
		// 	},
		// );

		return () => {
			value.then((fn) => fn?.());
			// convexError.then((fn) => fn?.());
			// errorMessage.then((fn) => fn?.());
		};
	}, []);

	return {
		value,
		convexError,
		errorMessage,
	};
};
