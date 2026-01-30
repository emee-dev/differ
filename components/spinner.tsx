import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

type SpinnerProps = {
	interval?: number;
	className?: string;
};

export const Spinner = ({ interval = 80, ...props }: SpinnerProps) => {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
		}, interval);

		return () => clearInterval(id);
	}, [interval]);

	return (
		<span aria-hidden className={cn(props.className)} {...props}>
			{SPINNER_FRAMES[frame]}
		</span>
	);
};
