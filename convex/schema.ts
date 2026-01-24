import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
	pastebins: defineTable({
		accountId: v.id("accounts"),
		appId: v.string(),
		body: v.string(),
		date: v.string(),
	}),
	attachments: defineTable({
		pasteId: v.id<"pastebins">("pastebins"),
		originalFileName: v.string(),
		storageId: v.id("_storage"),
	}),
	accounts: defineTable({
		appId: v.string(),
		password: v.string(),
	}),
	devices: defineTable({
		accountId: v.id("accounts"),
		label: v.string(),
		browserId: v.string(),
	}),
});

export default schema;
