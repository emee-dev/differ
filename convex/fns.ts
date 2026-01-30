import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const isSynced = query({
	args: {
		appId: v.string(),
	},
	handler: async (ctx, args) => {
		const appId = await ctx.db
			.query("accounts")
			.filter((q) => q.eq(q.field("appId"), args.appId))
			.first();

		if (!appId)
			return {
				isSynced: false,
			};

		return {
			isSynced: true,
		};
	},
});

export const syncApp = mutation({
	args: {
		appId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("accounts", {
			appId: args.appId,
		});
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

export const get_attachments = query({
	args: {
		pasteId: v.string(),
	},
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("attachments")
			.filter((q) => q.eq(q.field("pasteId"), args.pasteId))
			.collect();

		return await Promise.all(
			entries.map(async (f) => ({
				...f,
				downloadUrl: await ctx.storage.getUrl(f.storageId),
			})),
		);
	},
});

export const savePaste = mutation({
	args: {
		body: v.string(),
		appId: v.string(),
	},
	handler: async (ctx, args) => {
		const account = await ctx.db
			.query("accounts")
			.filter((q) => q.eq(q.field("appId"), args.appId))
			.first();

		if (!account)
			return {
				pasteId: null,
			};

		const record = await ctx.db.insert("pastebins", {
			accountId: account._id,
			appId: args.appId,
			body: args.body,
		});

		return {
			pasteId: record,
		};
	},
});

export const deletePaste = mutation({
	args: {
		pasteId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.runMutation(api.pastebin_client.deletePaste, {
			pasteId: args.pasteId as Id<"pastebins">,
		});
	},
});
