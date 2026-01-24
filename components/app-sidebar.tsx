import { SidebarHistory } from "@/components/sidebar-history";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarHeader,
	SidebarMenu,
	SidebarRail,
} from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryRecentChats } from "@/hooks/use-chat";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon, TrashIcon } from "lucide-react";
import * as React from "react";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {};

export function AppSidebar({ ...props }: AppSidebarProps) {
	const navigate = useNavigate();
	const { data, isLoading } = useQueryRecentChats();

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<div className="flex flex-row items-center justify-between">
						<div className="flex flex-row items-center gap-3">
							<span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
								Differ
							</span>
						</div>
						<div className="flex flex-row gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="h-8 p-1 md:h-fit md:p-2"
										onClick={() => {}}
										type="button"
										variant="ghost"
										size="icon-sm">
										<TrashIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent
									align="end"
									className="hidden md:block">
									Delete All Chats
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="h-8 p-1 md:h-fit md:p-2"
										onClick={() => {
											navigate({
												to: "/chats",
											});
										}}
										type="button"
										variant="ghost"
										size="icon-sm">
										<PlusIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent
									align="end"
									className="hidden md:block">
									New Chat
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarHistory isLoading={isLoading} recentChats={data} />
			<SidebarRail />
		</Sidebar>
	);
}
