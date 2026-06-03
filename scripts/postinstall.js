#!/usr/bin/env bun

import { spawn } from "node:child_process";
import os from "node:os";

async function runCommand(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    child.on("error", reject);
  });
}

// Prevent infinite recursion during postinstall
if (process.env.VELIX_POSTINSTALL_RUNNING) {
  process.exit(0);
}
process.env.VELIX_POSTINSTALL_RUNNING = "1";

console.log("Running postinstall...");

try {
  // Run sherif for workspace validation
  await runCommand("sherif");

  // Skip desktop native rebuilds in CI or on Windows
  if (process.env.CI || os.platform() === "win32") {
    console.log("Skipping desktop native rebuilds (CI or Windows)");
    console.log("Postinstall complete!");
    process.exit(0);
  }

  // Install native dependencies for desktop app (on macOS/Linux only)
  await runCommand("bun", ["run", "--filter=@velix/desktop", "install:deps"]);

  console.log("Postinstall complete!");
} catch (err) {
  console.error("Postinstall failed:", err);
  process.exit(1);
}
