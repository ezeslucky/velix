import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		NEXT_PUBLIC_API_URL: z.url().default("https://api.velix.sh"),
		NEXT_PUBLIC_STREAMS_URL: z.url().default("https://streams.velix.sh"),
		NEXT_PUBLIC_ELECTRIC_URL: z
			.url()
			.default("https://electric-proxy.avi-6ac.workers.dev"),
		NEXT_PUBLIC_WEB_URL: z.url().default("https://app.velix.sh"),
		NEXT_PUBLIC_MARKETING_URL: z.url().default("https://velix.sh"),
		NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
		NEXT_PUBLIC_POSTHOG_HOST: z.string().default("https://us.i.posthog.com"),
		SENTRY_DSN_DESKTOP: z.string().optional(),
		STREAMS_URL: z.url().default("https://velix-stream.fly.dev"),
		RELAY_URL: z.url().default("https://relay.velix.sh"),
	},

	runtimeEnv: {
		...process.env,
		// Explicitly list env vars so Vite can replace them at build time
		// (spreading process.env only works at runtime, not for bundled apps)
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NEXT_PUBLIC_STREAMS_URL: process.env.NEXT_PUBLIC_STREAMS_URL,
		NEXT_PUBLIC_ELECTRIC_URL: process.env.NEXT_PUBLIC_ELECTRIC_URL,
		NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
		NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL,
		NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
		NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
		SENTRY_DSN_DESKTOP: process.env.SENTRY_DSN_DESKTOP,
		STREAMS_URL: process.env.STREAMS_URL,
		RELAY_URL: process.env.RELAY_URL,
	},
	emptyStringAsUndefined: true,
	// Only allow skipping validation in development (never in production)
	skipValidation:
		process.env.NODE_ENV === "development" && !!process.env.SKIP_ENV_VALIDATION,

	// Main process runs in trusted Node.js environment
	isServer: true,
});
