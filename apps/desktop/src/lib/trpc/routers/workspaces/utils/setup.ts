import { cpSync, existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	CONFIG_FILE_NAME,
	LOCAL_CONFIG_FILE_NAME,
	PROJECT_VELIX_DIR_NAME,
	PROJECTS_DIR_NAME,
	VELIX_DIR_NAME,
} from "shared/constants";
import type { LocalSetupConfig, SetupConfig } from "shared/types";


export function copyVelixConfigToWorktree(
	mainRepoPath: string,
	worktreePath: string,
): void {
	const mainVelixDir = join(mainRepoPath, PROJECT_VELIX_DIR_NAME);
	const worktreeVelixDir = join(worktreePath, PROJECT_VELIX_DIR_NAME);

	if (existsSync(mainVelixDir) && !existsSync(worktreeVelixDir)) {
		try {
			cpSync(mainVelixDir, worktreeVelixDir, { recursive: true });
		} catch (error) {
			console.error(
				`Failed to copy ${PROJECT_VELIX_DIR_NAME} to worktree: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}

function readConfigFile(configPath: string): SetupConfig | null {
	if (!existsSync(configPath)) {
		return null;
	}

	try {
		const content = readFileSync(configPath, "utf-8");
		const parsed = JSON.parse(content) as SetupConfig;

		if (parsed.setup && !Array.isArray(parsed.setup)) {
			throw new Error("'setup' field must be an array of strings");
		}

		if (parsed.teardown && !Array.isArray(parsed.teardown)) {
			throw new Error("'teardown' field must be an array of strings");
		}

		if (parsed.run && !Array.isArray(parsed.run)) {
			throw new Error("'run' field must be an array of strings");
		}

		if (parsed.cwd !== undefined) {
			if (typeof parsed.cwd !== "string" || parsed.cwd.trim().length === 0) {
				throw new Error("'cwd' field must be a non-empty string");
			}
			parsed.cwd = parsed.cwd.trim();
		}

		return parsed;
	} catch (error) {
		console.error(
			`Failed to read setup config at ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
}

function readConfigFromPath(basePath: string): SetupConfig | null {
	return readConfigFile(
		join(basePath, PROJECT_VELIX_DIR_NAME, CONFIG_FILE_NAME),
	);
}

function readLocalConfigFile(filePath: string): LocalSetupConfig | null {
	if (!existsSync(filePath)) {
		return null;
	}

	try {
		const content = readFileSync(filePath, "utf-8");
		const parsed = JSON.parse(content) as LocalSetupConfig;

		for (const key of ["setup", "teardown", "run"] as const) {
			const value = parsed[key];
			if (value === undefined) continue;

			if (Array.isArray(value)) continue;

			if (typeof value === "object" && value !== null) {
				if (value.before !== undefined && !Array.isArray(value.before)) {
					throw new Error(`'${key}.before' must be an array of strings`);
				}
				if (value.after !== undefined && !Array.isArray(value.after)) {
					throw new Error(`'${key}.after' must be an array of strings`);
				}
				continue;
			}

			throw new Error(
				`'${key}' must be an array of strings or an object with before/after`,
			);
		}

		return parsed;
	} catch (error) {
		console.error(
			`Failed to read local config at ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
}

function readLocalConfigFromPath(basePath: string): LocalSetupConfig | null {
	return readLocalConfigFile(
		join(basePath, PROJECT_VELIX_DIR_NAME, LOCAL_CONFIG_FILE_NAME),
	);
}

function mergeBaseConfigs(
	base: SetupConfig | null,
	override: SetupConfig | null,
): SetupConfig | null {
	if (!base) return override;
	if (!override) return base;

	return {
		setup: override.setup ?? base.setup,
		teardown: override.teardown ?? base.teardown,
		run: override.run ?? base.run,
		cwd: override.cwd ?? base.cwd,
	};
}


export function mergeConfigs(
	base: SetupConfig,
	local: LocalSetupConfig,
): SetupConfig {
	const result: SetupConfig = { ...base };

	for (const key of ["setup", "teardown", "run"] as const) {
		const localValue = local[key];
		if (localValue === undefined) continue;

		if (Array.isArray(localValue)) {
			result[key] = localValue;
		} else {
			const before = localValue.before ?? [];
			const after = localValue.after ?? [];
			result[key] = [...before, ...(base[key] ?? []), ...after];
		}
	}

	return result;
}


export function loadSetupConfig({
	mainRepoPath,
	worktreePath,
	projectId,
}: {
	mainRepoPath: string;
	worktreePath?: string;
	projectId?: string;
}): SetupConfig | null {
	let base = readConfigFromPath(mainRepoPath);

	if (worktreePath) {
		const config = readConfigFromPath(worktreePath);
		if (config) {
			base = mergeBaseConfigs(base, config);
		}
	}

	if (projectId && !projectId.includes("/") && !projectId.includes("\\")) {
		const userConfigPath = join(
			homedir(),
			VELIX_DIR_NAME,
			PROJECTS_DIR_NAME,
			projectId,
			CONFIG_FILE_NAME,
		);
		const config = readConfigFile(userConfigPath);
		if (config) {
			base = mergeBaseConfigs(base, config);
		}
	}

	if (!base) return null;

	// Apply local config overlay (worktree first, then main repo)
	const worktreeLocal = worktreePath
		? readLocalConfigFromPath(worktreePath)
		: null;
	const localConfig = worktreeLocal ?? readLocalConfigFromPath(mainRepoPath);

	if (localConfig) {
		return mergeConfigs(base, localConfig);
	}

	return base;
}
