import { AppConfig, getAppConfig, updateAppConfig } from "@/lib/fns/utils";
import { isTauri } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useQueryAppConfig = () => {
	const results = useQuery({
		queryKey: ["fetch_app_config"],
		queryFn: async () => {
			if (!isTauri()) return null;

			return await getAppConfig();
		},
		initialData: null,
	});

	return results;
};

type ModelProvider = Pick<
	AppConfig,
	"app_id" | "selected_model" | "selected_provider"
>;

export const useUpdateModelProvider = () => {
	const queryClient = useQueryClient();
	const r = useMutation<boolean, {}, ModelProvider>({
		mutationKey: ["update_model_provider"],
		mutationFn: async (d) => {
			const status = await updateAppConfig({
				app_id: d.app_id,
				selected_model: d.selected_model,
				selected_provider: d.selected_provider,
			});

			return status;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["fetch_app_config"],
			});
		},
	});

	return r;
};

export const useUpdateAppConfig = () => {
	const queryClient = useQueryClient();
	const r = useMutation({
		mutationKey: ["update_app_config"],
		mutationFn: async (config: AppConfig) => {
			return await updateAppConfig(config);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["fetch_app_config"],
			});
		},
	});

	return r;
};
