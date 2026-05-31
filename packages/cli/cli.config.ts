import { boolean, defineConfig, string } from "@velix/cli-framework";

const VERSION = "0.2.19";

export default defineConfig({
	name: "velix",
	version: VERSION,
	commandsDir: "./src/commands",
	outfile: "./dist/velix",
	define: {
		"process.env.RELAY_URL": JSON.stringify(
			process.env.RELAY_URL ?? "https://relay.velix.sh",
		),
		"process.env.VELIX_API_URL": JSON.stringify(
			process.env.VELIX_API_URL ?? "https://api.velix.sh",
		),
		"process.env.VELIX_WEB_URL": JSON.stringify(
			process.env.VELIX_WEB_URL ?? "https://app.velix.sh",
		),
		"process.env.VELIX_VERSION": JSON.stringify(VERSION),
	},
	globals: {
		json: boolean().desc("Output as JSON (auto-on under CI/agent envs)"),
		quiet: boolean().desc("Output IDs only"),
		apiKey: string()
			.env("VELIX_API_KEY")
			.desc("Use a Velix API key (sk_live_…) instead of OAuth login"),
	},
});
