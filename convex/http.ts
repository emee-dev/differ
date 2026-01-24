import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
	path: "/uploadFile",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const sp = new URL(request.url);

		const pasteId = sp.searchParams.get("pasteid");
		const originalFileName = sp.searchParams.get("filename");

		if (!pasteId || !originalFileName) {
			return new Response(
				"PasteId and filename are required to continue this request",
				{
					status: 400,
				},
			);
		}

		const blob = await request.blob();
		const storageId = await ctx.storage.store(blob);

		await ctx.runMutation(api.pastebin.storeMetadata, {
			pasteId,
			storageId,
			originalFileName,
		});

		return new Response(null, {
			status: 200,
			headers: new Headers({
				"Access-Control-Allow-Origin":
					process.env?.CLIENT_ORIGIN! || "*",
				Vary: "origin",
			}),
		});
	}),
});

// Pre-flight request for /uploadFile
http.route({
	path: "/uploadFile",
	method: "OPTIONS",
	handler: httpAction(async (_, request) => {
		const headers = request.headers;
		if (
			headers.get("Origin") !== null &&
			headers.get("Access-Control-Request-Method") !== null &&
			headers.get("Access-Control-Request-Headers") !== null
		) {
			return new Response(null, {
				headers: new Headers({
					"Access-Control-Allow-Origin":
						process.env?.CLIENT_ORIGIN! || "*",
					"Access-Control-Allow-Methods": "POST",
					"Access-Control-Allow-Headers":
						"Content-Type, Digest",
					"Access-Control-Max-Age": "86400",
				}),
			});
		} else {
			return new Response();
		}
	}),
});

export default http;
