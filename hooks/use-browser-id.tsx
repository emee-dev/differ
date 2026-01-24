import { useQuery } from "@tanstack/react-query";
import { getThumbmark } from "@thumbmarkjs/thumbmarkjs";

export const useBrowserId = () => {
	const r = useQuery({
		queryKey: ["query_browser_fingerprint"],
		queryFn: async () => {
			const thumbmark = await getThumbmark();

			return thumbmark.thumbmark;
		},
		initialData: "",
	});

	return r;
};
