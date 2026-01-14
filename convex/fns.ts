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

export const getPasteBins = query({
	args: {
		// appId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("pastebins")
			// .filter((q) => q.eq(q.field("accountId"), args.appId))
			.order("desc")
			.take(15);
	},
});
