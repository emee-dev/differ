"use client";

import { ChatItem } from "@/components/sidebar-history-item";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
} from "@/components/ui/sidebar";
import { useDeleteChat } from "@/hooks/use-chat";
import { ChatsRecord } from "@/lib/fns/chats";
import { useParams } from "@tanstack/react-router";

type SidebarHistoryProps = {
	isLoading: boolean;
	recentChats: ChatsRecord[];
};

export function SidebarHistory(props: SidebarHistoryProps) {
	const { mutate: handleDelete } = useDeleteChat();

	const params = useParams({
		from: "/chats/$chatId",
		shouldThrow: false,
	});

	if (props.isLoading) {
		return (
			<SidebarGroup>
				<div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
					Today
				</div>
				<SidebarGroupContent>
					<div className="flex flex-col">
						{[44, 32, 28, 64, 52].map((item) => (
							<div
								className="flex h-8 items-center gap-2 rounded-md px-2"
								key={item}>
								<div
									className="h-4 max-w-(--skeleton-width) flex-1 rounded-md bg-sidebar-accent-foreground/10"
									style={
										{
											"--skeleton-width": `${item}%`,
										} as React.CSSProperties
									}
								/>
							</div>
						))}
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	return (
		<>
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarMenu>
						<div className="flex flex-col gap-y-0.5">
							<div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
								RECENT CHATS
							</div>

							{props.recentChats &&
								props.recentChats.map(
									(chat) => (
										<ChatItem
											chat={chat}
											isActive={
												chat.id ===
												params?.chatId
											}
											key={chat.id}
											onDelete={
												handleDelete
											}
										/>
									),
								)}
						</div>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</>
	);
}
