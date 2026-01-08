import React from "react";
import ReactDOM from "react-dom/client";
import { SingleDiff } from "./diff";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./global.css";

const loadRootData = () => <>isLoading...</>;

const router = createBrowserRouter([
	{
		path: "/",
		// Component: App,
		Component: SingleDiff,
		loader: loadRootData,
	},
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<RouterProvider router={router} />,
	</React.StrictMode>,
);
