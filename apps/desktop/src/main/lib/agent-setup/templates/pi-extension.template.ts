{{MARKER}}


import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export default function (pi: ExtensionAPI) {
	// Only activate inside a v2 VELIX terminal.
	if (!process.env.VELIX_TERMINAL_ID) return;

	const velixHome =
		process.env.VELIX_HOME_DIR || join(homedir(), ".velix");
	const notifyScript = join(velixHome, "hooks", "notify.sh");
	if (!existsSync(notifyScript)) return;

	const fire = (eventName: string) => {
		try {
			const child = spawn(notifyScript, [], {
				stdio: ["pipe", "ignore", "ignore"],
				detached: true,
				env: { ...process.env, VELIX_AGENT_ID: "pi" },
			});
			child.on("error", () => {
				/* swallow — never let hook failures affect pi */
			});
			child.stdin?.on("error", () => {
				/* swallow — happens if notify.sh exits before we finish writing */
			});
			child.stdin?.end(JSON.stringify({ hook_event_name: eventName }));
			child.unref();
		} catch {
			// spawn() can throw synchronously (EACCES, ENOENT). Stay silent.
		}
	};

	// Gate every hook on ctx.hasUI: when this is explicitly false (print
	// mode `-p`, JSON mode), pi is running as a subagent or non-interactive
	// helper and should NOT drive VELIX's working indicator. Interactive
	// and RPC sessions (the user-facing ones) have hasUI=true.
	//
	// We deliberately check `=== false` rather than `!ctx.hasUI` so that pi
	// versions older than 0.38.0 (where `hasUI` did not yet exist) still
	// fire hooks. On those older versions subagent flicker is possible, but
	// that's a niche regression; on >=0.38.0 the gate works precisely.
	const skip = (ctx: { hasUI?: boolean }) => ctx.hasUI === false;

	// Earliest signal pi is alive in this terminal — pi-mono fires
	// `session_start` once per session before any prompt arrives, which lets
	// the host bind the pane icon before the user types.
	pi.on("session_start", (_event, ctx) => {
		if (skip(ctx)) return;
		fire("SessionStart");
	});

	pi.on("session_end", (_event, ctx) => {
		if (skip(ctx)) return;
		fire("SessionEnd");
	});

	pi.on("before_agent_start", (_event, ctx) => {
		if (skip(ctx)) return;
		fire("UserPromptSubmit");
	});

	pi.on("tool_execution_end", (_event, ctx) => {
		if (skip(ctx)) return;
		fire("PostToolUse");
	});

	pi.on("agent_end", (_event, ctx) => {
		if (skip(ctx)) return;
		fire("Stop");
	});

	// Ensure we mark the agent as "stopped" if pi is killed mid-run, so the
	// VELIX working indicator doesn't get stuck on. Fires on Ctrl+C,
	// SIGTERM, SIGHUP, /quit, /reload, /new, /resume, /fork.
	pi.on("session_shutdown", (_event, ctx) => {
		if (skip(ctx)) return;
		fire("Stop");
	});
}
