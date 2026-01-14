import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
	pastebins: defineTable({
		accountId: v.id("accounts"),
		id: v.string(),
		body: v.string(),
		date: v.string(),
	}).index("find_by_id", ["id"]),
	attachments: defineTable({
		pasteId: v.id<"pastebins">("pastebins"),
		originalFileName: v.string(),
		storageId: v.id("_storage"),
	}),
	accounts: defineTable({
		appId: v.string(),
		password: v.string(),
		devices: v.array(
			v.object({
				label: v.string(),
				fingerprint: v.string(),
			}),
		),
	}),
});

export default schema;
