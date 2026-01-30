import { useEffect, useRef } from "react";

type TaskCleanup = () => Promise<void> | void;
type TaskFn<T> = (args?: T) => Promise<TaskCleanup | undefined>;

export function useTask<T>(task: TaskFn<T>, deps?: T): void {
	const startedRef = useRef(false);
	const cleanupRef = useRef<TaskCleanup | null>(null);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		Promise.resolve(task(deps)).then((cleanup) => {
			if (cleanup) {
				cleanupRef.current = cleanup;
			}
		});

		const handleBeforeUnload = () => {
			const cleanup = cleanupRef.current;
			if (cleanup) {
				cleanup();
			}
		};

		// Handle page reload
		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener(
				"beforeunload",
				handleBeforeUnload,
			);

			cleanupRef.current?.();
		};
	}, [deps]);
}
