import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { VELIX_DIR_NAME } from "shared/constants";

const VELIX_HOME_DIR_ENV = "VELIX_HOME_DIR";

export const VELIX_HOME_DIR =
	process.env[VELIX_HOME_DIR_ENV] || join(homedir(), VELIX_DIR_NAME);
process.env[VELIX_HOME_DIR_ENV] = VELIX_HOME_DIR;

export const VELIX_HOME_DIR_MODE = 0o700;
export const VELIX_SENSITIVE_FILE_MODE = 0o600;

export function ensureVelixHomeDirExists(): void {
	if (!existsSync(VELIX_HOME_DIR)) {
		mkdirSync(VELIX_HOME_DIR, {
			recursive: true,
			mode: VELIX_HOME_DIR_MODE,
		});
	}

	// Best-effort repair if the directory already existed with weak permissions.
	try {
		chmodSync(VELIX_HOME_DIR, VELIX_HOME_DIR_MODE);
	} catch (error) {
		console.warn(
			"[app-environment] Failed to chmod Velix home dir (best-effort):",
			VELIX_HOME_DIR,
			error,
		);
	}
}

// For lowdb - use our own path instead of app.getPath("userData")
export const APP_STATE_PATH = join(VELIX_HOME_DIR, "app-state.json");

// Window geometry state (separate from UI state - main process only, sync I/O)
export const WINDOW_STATE_PATH = join(VELIX_HOME_DIR, "window-state.json");
