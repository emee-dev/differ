import { PastebinClient } from "@/components/pastebin-client";
import { isTauri } from "@/lib/utils";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: () => {
		return (
			<div className="grid grid-rows-[40px_1fr] dark:bg-background scrollbar-hide">
				{/* Valid when app is deployed to vercel */}
				{!isTauri() && <PastebinClient />}

				{isTauri() && <Outlet />}
			</div>
		);
	},
});
