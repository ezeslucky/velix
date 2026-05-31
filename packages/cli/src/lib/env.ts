/**
 * Build-time constants baked into the CLI binary via `Bun.build({ define })`
 * (see `cli.config.ts`). In dev mode, falls back to actual process.env so
 * local dev can override these.
 */

export const env = {
	RELAY_URL: process.env.RELAY_URL || "https://relay.velix.sh",
	VELIX_API_URL: process.env.VELIX_API_URL || "https://api.velix.sh",
	VELIX_WEB_URL: process.env.VELIX_WEB_URL || "https://app.velix.sh",
	VERSION: process.env.VELIX_VERSION || "0.0.0-dev",
};
