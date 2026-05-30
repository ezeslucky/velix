

const isDebugEnabled =
	typeof process !== "undefined" &&
	(process.env.VELIX_DEBUG === "1" || process.env.VELIX_DEBUG === "true");

/**
 * Log a debug message if VELIX_DEBUG is enabled.
 *
 * @param namespace - Category for the log (e.g., "notifications", "agent-hooks")
 * @param args - Values to log (same as console.log)
 */
export function debugLog(namespace: string, ...args: unknown[]): void {
	if (isDebugEnabled) {
		console.log(`[debug:${namespace}]`, ...args);
	}
}

/**
 * Check if debug mode is enabled.
 */
export function isDebug(): boolean {
	return isDebugEnabled;
}
