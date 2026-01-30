import { ConvexProvider, ConvexReactClient } from "convex/react";
import { PastebinClient as PC } from "./pastebin-client";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export const PastebinClient = () => {
	return (
		<ConvexProvider client={convex}>
			<PC />
		</ConvexProvider>
	);
};
