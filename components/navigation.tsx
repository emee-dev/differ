import { Button } from "./ui/button";

export const Navigation = () => {
	return (
		<div className="flex items-center gap-x-2">
			<Button
				variant="ghost"
				size="icon-sm"
				title="Go back"
				onClick={() => window.history.back()}
				className="h-8 p-1 md:h-fit md:p-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor">
					<path
						fillRule="evenodd"
						d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z"
						clipRule="evenodd"
					/>
				</svg>
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				title="Go forward"
				onClick={() => window.history.forward()}
				className="h-8 p-0.5 md:h-fit md:p-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor">
					<path
						fillRule="evenodd"
						d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z"
						clipRule="evenodd"
					/>
				</svg>
			</Button>
		</div>
	);
};
