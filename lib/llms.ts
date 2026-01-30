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
	{
		id: "claude-opus-4-5",
		name: "Claude Opus 45",
		chef: "Anthropic",
		chefSlug: "anthropic",
		providers: ["anthropic"],
	},
	{
		id: "claude-haiku-4-5",
		name: "Claude Haiku 45",
		chef: "Anthropic",
		chefSlug: "anthropic",
		providers: ["anthropic"],
	},
	{
		id: "claude-sonnet-4-5",
		name: "Claude Sonnet 45",
		chef: "Anthropic",
		chefSlug: "anthropic",
		providers: ["anthropic"],
	},
	{
		id: "claude-opus-4-1",
		name: "Claude Opus 41",
		chef: "Anthropic",
		chefSlug: "anthropic",
		providers: ["anthropic"],
	},
	{
		id: "gpt-5.2-pro",
		name: "GPT 5.2 pro",
		chef: "OpenAI",
		chefSlug: "openai",
		providers: ["openai"],
	},
	{
		id: "gpt-5.2-chat-latest",
		name: "GPT 5.2 chat latest",
		chef: "OpenAI",
		chefSlug: "openai",
		providers: ["openai"],
	},
	{
		id: "gpt-5.2",
		name: "GPT 5.2",
		chef: "OpenAI",
		chefSlug: "openai",
		providers: ["openai"],
	},
	{
		id: "gpt-5.1-codex",
		name: "GPT 5.1 codex",
		chef: "OpenAI",
		chefSlug: "openai",
		providers: ["openai"],
	},
] as const;

export type Providers = (typeof models)[number]["chefSlug"];

export type Model = {
	id: string;
	name: string;
	chef: string;
	chefSlug: string;
	providers: string[];
};
