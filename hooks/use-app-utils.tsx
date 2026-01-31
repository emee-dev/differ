import {
	AppConfig,
	cmd_get_all_tasks,
	cmd_get_app_config,
	cmd_open_url,
	cmd_update_app_config,
} from "@/lib/ipc/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isTauri } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { toast } from "sonner";

export const useQueryAppConfig = () => {
	const r = useQuery({
		queryKey: ["fetch_app_config"],
		queryFn: async () => {
			if (!isTauri()) return null;

			return await cmd_get_app_config();
		},
		initialData: null,
	});

	useEffect(() => {
		if (!r.error) return;

		toast.error("Unable to load app settings", {
			description:
				"The application configuration could not be loaded. Please restart the app or try again.",
		});

		console.error("Failed to fetch app config:", r.error);
	}, [r.error]);

	return r;
};

type ModelProvider = Pick<
	AppConfig,
	"app_id" | "selected_model" | "selected_provider"
>;

export const useUpdateModelProvider = () => {
	const queryClient = useQueryClient();

	const r = useMutation({
		mutationKey: ["update_model_provider"],
		mutationFn: async (d: ModelProvider) => {
			return await cmd_update_app_config({
				app_id: d.app_id,
				selected_model: d.selected_model,
				selected_provider: d.selected_provider,
			});
		},

		onSuccess: () => {
			toast.success("Model updated", {
				description:
					"Your selected model and provider have been saved successfully.",
			});

			queryClient.invalidateQueries({
				queryKey: ["fetch_app_config"],
			});
		},

		onError: (error) => {
			toast.error("Failed to update model", {
				description:
					"The selected model could not be saved. Please try again.",
			});

			console.error("Model/provider update failed:", error);
		},
	});

	return r;
};

export const useUpdateAppConfig = () => {
	const queryClient = useQueryClient();

	const r = useMutation({
		mutationKey: ["update_app_config"],
		mutationFn: async (config: AppConfig) => {
			return await cmd_update_app_config(config);
		},

		onSuccess: () => {
			toast.success("Settings saved", {
				description:
					"Your settings have been updated successfully.",
			});

			queryClient.invalidateQueries({
				queryKey: ["fetch_app_config"],
			});
		},

		onError: (error) => {
			toast.error("Failed to save settings", {
				description:
					"Your changes could not be saved. Please try again.",
			});

			console.error("App config update failed:", error);
		},
	});

	return r;
};

export const useOpenURL = () => {
	const r = useMutation({
		mutationKey: ["open_url_in_browser"],
		mutationFn: async (url: string) => {
			return await cmd_open_url(url);
		},

		onError: (error) => {
			toast.error("Failed to open URL", {
				description:
					"Your ensure you have configured a default browser.",
			});
			console.error("Failed to open URL:", error);
		},
	});

	return r;
};

export const useAllTasks = () => {
	const r = useQuery({
		queryKey: ["query_all_tasks"],
		queryFn: async () => {
			return await cmd_get_all_tasks();
		},
		initialData: [],
		refetchOnMount: true,
	});

	return r;
};
