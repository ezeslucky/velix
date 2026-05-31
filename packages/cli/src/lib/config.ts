import {
	chmodSync,
	existsSync,
	mkdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { env } from "./env";

export type VelixConfig = {
	auth?: {
		accessToken: string;
		refreshToken?: string;
		expiresAt: number;
	};
	apiKey?: string;
	organizationId?: string;
};

export const VELIX_HOME_DIR =
	process.env.VELIX_HOME_DIR ?? join(homedir(), ".velix");
const CONFIG_PATH = join(VELIX_HOME_DIR, "config.json");

function ensureDir() {
	if (!existsSync(VELIX_HOME_DIR)) {
		mkdirSync(VELIX_HOME_DIR, { recursive: true, mode: 0o700 });
	}
	try {
		const stat = statSync(VELIX_HOME_DIR);
		if ((stat.mode & 0o077) !== 0) chmodSync(VELIX_HOME_DIR, 0o700);
	} catch {}
}

export function readConfig(): VelixConfig {
	if (!existsSync(CONFIG_PATH)) return {};
	try {
		const stat = statSync(CONFIG_PATH);
		if ((stat.mode & 0o077) !== 0) chmodSync(CONFIG_PATH, 0o600);
	} catch {}
	return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

export function writeConfig(config: VelixConfig): void {
	ensureDir();
	writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), {
		mode: 0o600,
	});
	try {
		chmodSync(CONFIG_PATH, 0o600);
	} catch {}
}

export function getApiUrl(): string {
	return env.VELIX_API_URL;
}
