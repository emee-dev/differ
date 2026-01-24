export const models = [
	{
		id: "gemini-3-pro-preview",
		name: "Gemini 3 Pro Preview",
		chef: "Google",
		chefSlug: "google",
		providers: ["google"],
	},
	{
		id: "gemini-2.5-pro",
		name: "Gemini 2.5 Pro",
		chef: "Google",
		chefSlug: "google",
		providers: ["google"],
	},
	{
		id: "gemini-2.5-flash",
		name: "Gemini 2.5 Flash",
		chef: "Google",
		chefSlug: "google",
		providers: ["google"],
	},
	{
		id: "gemini-2.5-flash-lite",
		name: "Gemini 2.5 Flash Lite",
		chef: "Google",
		chefSlug: "google",
		providers: ["google"],
	},
	{
		id: "gemini-2.5-flash-lite-preview-06-17",
		name: "Gemini 2.5 Flash Lite (Preview · 06-17)",
		chef: "Google",
		chefSlug: "google",
		providers: ["google"],
	},
	{
		id: "gemini-2.0-flash",
		name: "Gemini 2.0 Flash",
		chef: "Google",
		chefSlug: "google",
		providers: ["google"],
	},
	{
		id: "llama-3.1-8b-instant",
		name: "LLaMA 3.1 8B Instant",
		chef: "Meta",
		chefSlug: "groq",
		providers: ["groq"],
	},
] as const;

export type Model = {
	id: string;
	name: string;
	chef: string;
	chefSlug: string;
	providers: string[];
};
