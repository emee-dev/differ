import {
	cmd_delete_local_paste_by_id,
	cmd_find_recent_local_pastes,
	cmd_get_paste_by_id,
	cmd_is_synced,
	cmd_save_remote_paste,
	cmd_save_remote_paste_locally,
	cmd_sync_app_to_remote_server,
	deleteRemotePasteById,
	LocalPastes,
	SaveRemotePaste,
	SaveRemotePasteLocally,
	SyncAppArgs,
} from "@/lib/ipc/pastebin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { DownloadChannel } from "./use-download";

export const useQueryPasteById = (pasteId: string) => {
	const r = useQuery({
		queryKey: ["query_paste_by_id", pasteId],
		queryFn: async () => await cmd_get_paste_by_id(pasteId),
		enabled: !!pasteId,
		initialData: null,
	});

	useEffect(() => {
		if (!r.error) return;

		toast.error("Unable to load paste", {
			description:
				"Something went wrong while fetching the paste. Please try again.",
		});

		console.error("Failed to fetch paste:", r.error);
	}, [r.error]);

	return r;
};

export const useRemoteSavePaste = () => {
	return useMutation({
		mutationKey: ["save_remote_paste"],
		mutationFn: async (args: SaveRemotePaste) => {
			return await cmd_save_remote_paste(args);
		},
		onSuccess() {
			toast.success("Paste saved successfully", {
				description: "Your paste has been uploaded.",
			});
		},
		onError(error: any) {
			toast.error("Failed to save paste", {
				description:
					"The paste could not be uploaded. Please check your connection and try again.",
			});

			console.error("Remote save failed:", error);
		},
	});
};

export const useQueryLocalPastes = () => {
	const r = useQuery({
		queryKey: ["query_local_pastes"],
		queryFn: async () => await cmd_find_recent_local_pastes(),
		initialData: [] as LocalPastes[],
	});

	useEffect(() => {
		if (!r.error) return;

		toast.error("Unable to load local pastes", {
			description:
				"Local pastes could not be retrieved. Please restart the app if the issue persists.",
		});

		console.error("Failed to load local pastes:", r.error);
	}, [r.error]);

	return r;
};

const FIVE_SECONDS = 5 * 1000;

export const useIsSynced = (appId?: string) => {
	const r = useQuery({
		queryKey: ["query_is_app_synced", appId],
		queryFn: async () => {
			return await cmd_is_synced(appId as string);
		},
		enabled: !!appId,
		refetchInterval(q) {
			if (!q.state.data?.isSynced) {
				return FIVE_SECONDS;
			}

			return false;
		},
	});

	return r;
};

export const useSyncApp = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["sync_app_to_remote_server"],
		mutationFn: async (args: SyncAppArgs) => {
			await cmd_sync_app_to_remote_server(args);

			return args;
		},
		onSuccess(d) {
			queryClient.invalidateQueries({
				queryKey: ["query_is_app_synced", d.appId],
			});

			toast.success("AppId synced", {
				description: "This app has been synced.",
			});
		},

		onError(error) {
			toast.error("Failed to sync appId", {
				description:
					"The appId could not be synced. Please try again.",
			});

			console.error("Sync app failed:", error);
		},
	});
};

export const useDeleteLocalPaste = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const params = useParams({
		from: "/pastebin/$pasteId",
		shouldThrow: false,
	});

	return useMutation({
		mutationKey: ["delete_local_paste_by_id"],
		mutationFn: async (pasteId: string) => {
			await cmd_delete_local_paste_by_id(pasteId);

			return pasteId;
		},
		onSuccess(pasteId) {
			queryClient.invalidateQueries({
				queryKey: ["query_local_pastes"],
			});

			toast.success("Paste deleted", {
				description:
					"The paste has been removed from your local storage.",
			});

			if (params?.pasteId === pasteId) {
				navigate({
					to: "/pastebin",
				});
			}
		},

		onError(error) {
			toast.error("Failed to delete paste", {
				description:
					"The paste could not be deleted. Please try again.",
			});

			console.error("Local delete failed:", error);
		},
	});
};

export const useDeleteRemotePaste = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["delete_remote_paste"],
		mutationFn: async (pasteId: string) => {
			return await deleteRemotePasteById(pasteId);
		},
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ["query_local_pastes"],
			});

			toast.success("Remote paste deleted", {
				description:
					"The paste has been successfully removed from the server.",
			});
		},

		onError(error) {
			toast.error("Failed to delete remote paste", {
				description:
					"The server could not delete this paste. Please try again later.",
			});

			console.error("Remote delete failed:", error);
		},
	});
};

export const useSaveRemotePasteLocally = (channel: DownloadChannel | null) => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationKey: ["save_remote_paste_locally"],
		mutationFn: async (args: SaveRemotePasteLocally) => {
			if (!channel) return;
			const localPasteId = await cmd_save_remote_paste_locally(
				args,
				channel,
			);

			return localPasteId;
		},

		onSuccess: async (localPasteId) => {
			if (!localPasteId) return;

			toast.success("Paste saved locally", {
				description:
					"The remote paste has been downloaded and stored locally.",
			});

			queryClient.invalidateQueries({
				queryKey: ["query_local_pastes"],
			});

			await new Promise((r) => setTimeout(r, 500));

			navigate({
				to: "/pastebin/$pasteId",
				params: {
					pasteId: localPasteId,
				},
			});
		},

		onError(error) {
			toast.error("Failed to save paste locally", {
				description:
					"The paste could not be saved on this device. Please try again.",
			});

			console.error("Local save failed:", error);
		},
	});
};
