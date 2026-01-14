import { ThemeProvider } from "@/components/theme-provider";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import "unfonts.css";
import "./global.css";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	// <StrictMode>
	<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
		<RouterProvider router={router} />
	</ThemeProvider>,
	// </StrictMode>,
);
