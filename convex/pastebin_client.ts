import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const getAccount = query({
	args: {
		browserId: v.string(),
	},
	handler: async (ctx, args) => {
		const device = await ctx.db
			.query("devices")
			.filter((q) => q.eq(q.field("browserId"), args.browserId))
			.first();

		if (!device) return null;

		const account = await ctx.db
			.query("accounts")
			.filter((q) => q.eq(q.field("_id"), device?.accountId))
			.first();

		if (!account) return null;

		const devices = await ctx.db
			.query("devices")
			.filter((q) =>
				q.and(
					q.eq(q.field("accountId"), account?._id),
					q.not(
						q.eq(
							q.field("browserId"),
							device?.browserId,
						),
					),
				),
			)
			.take(5);

		return {
			account,
			devices: [device, ...devices],
		};
	},
});

export const createAccount = mutation({
	args: {
		appId: v.string(),

		// device info
		label: v.string(),
		browserId: v.string(),
	},
	handler: async (ctx, args) => {
		const device = await ctx.db
			.query("devices")
			.filter((q) => q.eq(q.field("browserId"), args.browserId))
			.first();

		const account = await ctx.db
			.query("accounts")
			.filter((q) => q.eq(q.field("appId"), args.appId))
			.first();

		if (device && account) return;

		const accountId = await ctx.db.insert("accounts", {
			appId: args.appId,
		});

		await ctx.db.insert("devices", {
			accountId,
			label: args.label,
			browserId: args.browserId,
		});
	},
});

export const addDevice = mutation({
	args: {
		label: v.string(),
		browserId: v.string(),
		accountId: v.id("accounts"),
	},
	handler: async (ctx, args) => {
		const isExistingDevice = await ctx.db
			.query("devices")
			.filter((q) => q.eq(q.field("browserId"), args.browserId))
			.first();

		if (isExistingDevice) return;

		await ctx.db.insert("devices", {
			label: args.label,
			accountId: args.accountId,
			browserId: args.browserId,
		});
	},
});

export const removeDevice = mutation({
	args: {
		deviceId: v.id("devices"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.delete(args.deviceId);
	},
});

export const savePaste = mutation({
	args: {
		accountId: v.string(),
		appId: v.string(),
		body: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("pastebins", {
			accountId: args.accountId as Id<"accounts">,
			appId: args.appId,
			body: args.body,
		});
	},
});

export const recentHistory = query({
	args: {
		accountId: v.string(),
		appId: v.string(),
	},
	handler: async (ctx, args) => {
		return ctx.db
			.query("pastebins")
			.filter((q) =>
				q.and(
					q.eq(q.field("accountId"), args.accountId),
					q.eq(q.field("appId"), args.appId),
				),
			)
			.order("desc")
			.take(20);
	},
});

export const deletePaste = mutation({
	args: {
		pasteId: v.string(),
	},
	handler: async (ctx, args) => {
		const pasteId = args.pasteId as Id<"pastebins">;

		const attachments = await ctx.db
			.query("attachments")
			.filter((q) => q.eq(q.field("pasteId"), pasteId))
			.collect();

		// Delete records & files
		await Promise.all([
			ctx.db.delete(pasteId),
			...attachments.map((file) => ctx.db.delete(file._id)),
			...attachments.map((file) =>
				ctx.storage.delete(file.storageId),
			),
		]);
	},
});

export const storeMetadata = mutation({
	args: {
		pasteId: v.string(),
		originalFileName: v.string(),
		originalFileSize: v.string(),
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("attachments", {
			originalFileName: args.originalFileName,
			originalFileSize: args.originalFileSize,
			pasteId: args.pasteId as Id<"pastebins">,
			storageId: args.storageId,
		});
	},
});
