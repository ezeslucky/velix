import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeFileIfChanged } from "./agent-wrappers-common";

export const PI_EXTENSION_FILE = "velix-hooks.ts";

const PI_EXTENSION_SIGNATURE = "// Velix pi extension";
const PI_EXTENSION_VERSION = "v1";
export const PI_EXTENSION_MARKER = `${PI_EXTENSION_SIGNATURE} ${PI_EXTENSION_VERSION}`;

const PI_EXTENSION_TEMPLATE_PATH = path.join(
	__dirname,
	"templates",
	"pi-extension.template.ts",
);

export function getPiExtensionPath(): string {
	return path.join(
		os.homedir(),
		".pi",
		"agent",
		"extensions",
		PI_EXTENSION_FILE,
	);
}

export function getPiExtensionContent(): string {
	const template = fs.readFileSync(PI_EXTENSION_TEMPLATE_PATH, "utf-8");
	return template.replace("{{MARKER}}", PI_EXTENSION_MARKER);
}

export function createPiExtension(): void {
	const extensionPath = getPiExtensionPath();
	const content = getPiExtensionContent();
	fs.mkdirSync(path.dirname(extensionPath), { recursive: true });
	const changed = writeFileIfChanged(extensionPath, content, 0o644);
	console.log(`[agent-setup] ${changed ? "Updated" : "Verified"} pi extension`);
}
