import { auth, type Session } from "@velix/auth/server";
import { ORGANIZATION_HEADER } from "@velix/shared/constants";
import { createCaller as makeAppCaller } from "@velix/trpc";
import type { McpContext } from "./auth";

export type McpCaller = ReturnType<typeof makeAppCaller>;


export function createMcpCaller(ctx: McpContext): McpCaller {
	const headers = new Headers();
	headers.set("authorization", `Bearer ${ctx.bearerToken}`);
	headers.set(ORGANIZATION_HEADER, ctx.organizationId);

	const session = {
		user: {
			id: ctx.userId,
			email: ctx.email,
			emailVerified: true,
			name: ctx.email,
			image: null,
			createdAt: new Date(0),
			updatedAt: new Date(0),
		},
		session: {
			id: `mcp-v2-${ctx.requestId}`,
			userId: ctx.userId,
			activeOrganizationId: ctx.organizationId,
			organizationIds: ctx.organizationIds,
			expiresAt: new Date(Date.now() + 5 * 60_000),
			token: ctx.bearerToken,
			ipAddress: null,
			userAgent: "mcp-v2",
			createdAt: new Date(0),
			updatedAt: new Date(0),
		},
	} as unknown as Session;

	return makeAppCaller({
		session,
		auth,
		headers,
	});
}
