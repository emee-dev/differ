import { v } from "convex/values";
import { query } from "./_generated/server";

export const getAppId = query({
	args: {
		appId: v.string(),
	},
	handler: async (ctx, args) => {
		const appId = await ctx.db
			.query("accounts")
			.filter((q) => q.eq(q.field("appId"), args.appId))
			.first();

		if (!appId) return false;

		return true;
	},
});

export const get_recent_pastes = query({
	args: {
		app_id: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("pastebins")
			.filter((q) => q.eq(q.field("appId"), args.app_id))
			.order("desc")
			.take(15);
	},
});
