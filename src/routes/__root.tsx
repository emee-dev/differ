import AppNavbar from "@/components/nav-bar";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: () => (
		<div className="grid overflow-hidden grid-rows-[40px_1fr] gap-y-1 w-screen h-screen dark:bg-background">
			<AppNavbar />
			<Outlet />
		</div>
	),
	// async beforeLoad(ctx) {
	// 	// init subscriptions
	// 	await initConvex();
	// },
});
