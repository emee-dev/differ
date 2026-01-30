import { RemotePastes } from "@/lib/ipc/pastebin";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

type ConvexFunctions = "fns:get_recent_pastes";

type QueryResults = {
	data: RemotePastes[];
	error: string;
};

export const useConvexQuery = (fn: ConvexFunctions): QueryResults => {
	const [data, setData] = useState<RemotePastes[]>([]);
	const [convex_error, set_convex_error] = useState<string>("");
	const [error_message, set_error_message] = useState<string>("");

	useEffect(() => {
		const value = listen("get_value", (ev) => {
			setData(ev.payload as any);
		});
		const convexError = listen(`convex_error`, (ev) => {
			set_convex_error(ev.payload as string);
		});
		const errorMessage = listen(`error_message`, (ev) => {
			set_error_message(ev.payload as string);
		});

		return () => {
			value.then((fn) => fn?.());
			convexError.then((fn) => fn?.());
			errorMessage.then((fn) => fn?.());
		};
	}, []);

	return {
		data,
		error: error_message ? error_message : convex_error,
	};
};
