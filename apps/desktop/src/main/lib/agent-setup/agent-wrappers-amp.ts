import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
	buildWrapperScript,
	createWrapper,
	writeFileIfChanged,
} from "./agent-wrappers-common";

export function createAmpWrapper(): void {
	const script = buildWrapperScript("amp", `exec "$REAL_BIN" "$@"`, {
		agentId: "amp",
	});
	createWrapper("amp", script);
}

export const AMP_PLUGIN_FILE = "velix-lifecycle.ts";
const AMP_PLUGIN_SIGNATURE = "// Velix Amp lifecycle plugin";
const AMP_PLUGIN_VERSION = "v3";
export const AMP_PLUGIN_MARKER = `${AMP_PLUGIN_SIGNATURE} ${AMP_PLUGIN_VERSION}`;
const AMP_PLUGIN_TEMPLATE_PATH = path.join(
	__dirname,
	"templates",
	"amp-plugin.template.ts",
);

/**
 * Amp loads system plugins from ~/.config/amp/plugins/*.ts.
 *
 * @see https://ampcode.com/manual#plugins
 */
export function getAmpGlobalPluginPath(): string {
	return path.join(os.homedir(), ".config", "amp", "plugins", AMP_PLUGIN_FILE);
}

export function getAmpPluginContent(): string {
	const template = fs.readFileSync(AMP_PLUGIN_TEMPLATE_PATH, "utf-8");
	return template.replace("{{MARKER}}", AMP_PLUGIN_MARKER);
}

export function createAmpPlugin(): void {
	const pluginPath = getAmpGlobalPluginPath();
	fs.mkdirSync(path.dirname(pluginPath), { recursive: true });
	const changed = writeFileIfChanged(pluginPath, getAmpPluginContent(), 0o644);
	console.log(
		`[agent-setup] ${changed ? "Updated" : "Verified"} Amp lifecycle plugin`,
	);
}
