import { Button } from "@/components/ui/button";
import { Tasks } from "@/lib/ipc/utils";
import { AlertCircle, Clock, Loader, Wifi, Zap } from "lucide-react";

interface TaskStatusProps {
	tasks: Tasks[];
	onRetry?: (taskId: string) => void;
}

const statusConfig = {
	Start: <Clock className="size-5" />,
	Initialized: <Clock className="size-5" />,
	Operational: <Loader className="size-5 animate-spin" />,
	Panicked: <AlertCircle className="size-5" />,
	Endpoint: (
		<Wifi className="size-5 text-green-500 animate-pulse duration-300" />
	),
};

const taskNames = {
	convex_subscription: "Convex API",
	chat_api: "Chat API",
};

export function TaskCard({
	task,
	onRetry,
}: {
	task: Tasks;
	onRetry?: (taskId: string) => void;
}) {
	const Icon = statusConfig[task.status.type];
	const showRetry = task.status.type === "Panicked";
	const showEndpoint = task.status.type === "Endpoint";

	return (
		<div className="group relative rounded-lg border border-border bg-card p-2.5 transition-all duration-200 hover:border-primary/50 hover:shadow-xs hover:shadow-primary/5">
			<div className="flex flex-col gap-4">
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						<p className="font-medium text-foreground text-sm space-y-2.5">
							{taskNames[task.id]}
						</p>
						{showEndpoint && "url" in task.status && (
							<div className="space-y-1.5">
								<p className="rounded-md bg-muted/50 px-2 py-1.5 font-mono text-xs text-foreground break-all">
									{task.status.url}
								</p>
							</div>
						)}

						{task.id === "convex_subscription" && (
							<div className="space-y-1.5">
								<p className="rounded-md bg-muted/50 px-2 py-1.5 font-mono text-xs text-foreground break-all">
									fns:get_recent_pastes
								</p>
							</div>
						)}

						{task.status.type === "Panicked" && (
							<p className="text-xs text-destructive">
								{task.status.error}
							</p>
						)}
					</div>
					<div
						className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200 whitespace-nowrap`}>
						{Icon}
					</div>
				</div>

				{showRetry && (
					<Button
						size="sm"
						variant="outline"
						onClick={() => onRetry?.(task.id)}
						className="w-fit border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
						Try Again
					</Button>
				)}
			</div>
		</div>
	);
}

export function AllTasks({ tasks, onRetry }: TaskStatusProps) {
	if (!tasks || tasks.length === 0) {
		return (
			<div className="rounded-lg border border-dashed border-border bg-card/50 p-8">
				<div className="text-center">
					<Zap className="mx-auto mb-3 size-8 text-muted-foreground opacity-50" />
					<p className="text-sm text-muted-foreground">
						No active services at the moment
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{tasks.map((task) => (
				<TaskCard key={task.id} task={task} onRetry={onRetry} />
			))}
		</div>
	);
}
