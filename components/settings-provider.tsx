import { createContext, ReactNode, useContext, useState } from "react";

export type Sections = "general" | "api" | "paste" | "services";

export interface SettingsDialogContextValue {
	open: boolean;
	onOpenChange: (s: boolean) => void;
	section: Sections;
	toggleDialog: (tab?: Sections) => void;
	setSection: (section: Sections) => void;
}

const SettingsDialogContext = createContext<SettingsDialogContextValue | null>(
	null,
);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
	const [open, onOpenChange] = useState(false);
	const [section, setSection] = useState<Sections>("general");

	const toggleDialog = (tab: Sections = "general") => {
		if (tab) {
			setSection(tab);
		}

		onOpenChange(!open);
	};

	return (
		<SettingsDialogContext.Provider
			value={{
				section,
				open,
				onOpenChange,
				toggleDialog,
				setSection,
			}}>
			{children}
		</SettingsDialogContext.Provider>
	);
};

export const useSettingsDialog = () => {
	const context = useContext(SettingsDialogContext);

	if (!context) {
		throw new Error(
			"useSettingsDialog must be used within a SettingsDialogContext",
		);
	}

	return context;
};
