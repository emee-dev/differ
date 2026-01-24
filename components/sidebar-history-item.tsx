import { ChatsRecord } from "@/lib/fns/chats";
import { Link } from "@tanstack/react-router";
import { MoreHorizontalIcon, TrashIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";

export const ChatItem = ({
	chat,
	isActive,
	onDelete,
}: {
	chat: ChatsRecord;
	isActive: boolean;
	onDelete: (chatId: string) => void;
}) => {
	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={isActive}>
				<Link
					preload={false}
					to="/chats/$chatId"
					params={{
						chatId: chat.id,
					}}>
					<span>{chat.label}</span>
				</Link>
			</SidebarMenuButton>

			<DropdownMenu modal={true}>
				<DropdownMenuTrigger asChild>
					<SidebarMenuAction
						className="mr-0.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						showOnHover={!isActive}>
						<MoreHorizontalIcon />
						<span className="sr-only">More</span>
					</SidebarMenuAction>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" side="right">
					<DropdownMenuItem
						className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
						onSelect={() => onDelete(chat.id)}>
						<TrashIcon />
						<span>Delete</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	);
};

// export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
// 	if (prevProps.isActive !== nextProps.isActive) {
// 		return false;
// 	}
// 	return true;
// });
