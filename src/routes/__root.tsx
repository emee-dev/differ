import { PasteBinClient } from "@/components/pastebin-client";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { isTauri } from "@tauri-apps/api/core";

export const Route = createRootRoute({
	component: () => {
		return (
			<div className="grid grid-rows-[40px_1fr] dark:bg-background scrollbar-hide">
				{!isTauri() && <PasteBinClient />}

				{isTauri() && <Outlet />}
			</div>
		);
	},
});
