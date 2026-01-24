import { AppSidebar } from "@/components/app-sidebar";
import AppNavbar from "@/components/nav-bar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/chats")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<AppNavbar
					title={false}
					sidebarTrigger={<SidebarTrigger />}
				/>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
