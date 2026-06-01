---
name: velix
description: Create workspaces, spawn agents, schedule automations, and manage Velix projects/tasks/hosts via the `velix` CLI. Use to orchestrate coding agents across devices from the terminal.
allowed-tools: Bash(velix:*)
---

# Velix CLI

The `velix` command provides fast access to spawning subagents and creating copies of projects in isolated workspaces.

If the CLI is not installed, you can install it using `curl -fsSL https://velix.sh/cli/install.sh | sh`.

## Core Workflow

1. **Pick a project and host**: `velix projects list` and `velix hosts list`.
2. **Create a Workspace**: `velix workspaces create --project <id> --host <id> --name "..." --branch <branch>` (or `--pr <number>`, or `--local` instead of `--host`).
3. **Spawn an agent**: `velix agents run --workspace <id> --agent claude --prompt "..."`.
4. **Plan work**: `velix tasks create --title "..."` then `velix tasks update <id-or-slug>` as work progresses.

## Runtime Context

When invoked from inside a Velix workspace or terminal, these environment variables are set and can provide you with context about your session:

- `$VELIX_WORKSPACE_ID` — current workspace id (use directly with `velix agents run --workspace`, `velix automations create --workspace`, etc.)
- `$VELIX_TERMINAL_ID` — current terminal session id

If `$VELIX_WORKSPACE_ID` is unset, you're not inside a Velix workspace — follow the Core Workflow above to create one.

## Workspaces

```bash
velix workspaces create --project <id> --host <id> --name "..." --branch <branch>
velix workspaces create --project <id> --local --name "..." --pr <number>
velix workspaces list [--host <id> | --local]
velix workspaces update <id> --name "..."
velix workspaces delete <id> [<id>...]
```

Provide exactly one of `--branch` or `--pr`. With `--pr`, the host checks out the verified PR head and derives the branch. `--base-branch <name>` is the fork point when `--branch` doesn't exist yet.

## Agents

```bash
velix agents list --host <id>                 # Configured agents on a host (LABEL, PRESET, COMMAND, ID)
velix agents list --local                     # Same, for this machine
velix agents run --workspace <id> --agent claude --prompt "..."
```

`--agent` accepts a preset id (e.g. `claude`, `codex`) or a HostAgentConfig instance UUID. Pass `--attachment-id <uuid>` once per attachment. Use `agents list` first if you don't already know which agents are installed on the target host.

## Tasks

```bash
velix tasks list                              # List tasks in active org
velix tasks list --priority high --assignee-me
velix tasks get <id-or-slug>
velix tasks create --title "..." [--priority high]
velix tasks update <id-or-slug> --status-id <id>
velix tasks delete <id-or-slug>
```

Filter flags: `--status`, `--priority`, `--assignee`, `--assignee-me` (`-m`), `--creator-me`, `--search` (`-s`), `--limit`, `--offset`.

## Projects

```bash
velix projects list                           # NAME, SLUG, REPO, ID
```

A project is a checked-out repo. You'll need a project ID to create workspaces or schedule automations.

## Hosts

```bash
velix hosts list                              # NAME, ONLINE, ID
```

A host is a registered machine that can run workspaces. Use `--local` on workspace commands to target this machine.

## Automations (alias: `auto`)

Automations run an agent session on a schedule. Each fire dispatches to a host and produces a workspace you (or a teammate) can open and continue interactively. Two modes:

Provide one or both of `--project` or `--workspace`. Schedules are stored as [RFC 5545 RRules](https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5). Runs are dispatched at-least-once — design prompts to be idempotent. If the target host is offline at fire time, the run is marked `skipped_offline` and the next occurrence schedules normally. 
If a workspace is omitted, it will create a fresh clone of a repo for the automation to run in.

```bash
velix automations list
velix automations get <id-or-slug>
velix automations create --name "..." --rrule "FREQ=DAILY;BYHOUR=9" \
  --project <id> --agent claude --prompt-file prompt.md
velix automations create --name "..." --rrule "FREQ=WEEKLY;BYDAY=MO" \
  --workspace <id> --agent claude --prompt "Inline prompt"
velix automations update <id> --name "..."
velix automations pause <id>
velix automations resume <id>
velix automations run <id>                    # One-off run
velix automations delete <id>
velix automations logs <id> [--limit N]       # Recent runs
velix automations prompt get <id>             # Print prompt to stdout
velix automations prompt set <id> --from-file prompt.md
```

`prompt get | prompt set` round-trips byte-exact, so:

```bash
velix automations prompt get <id> > prompt.md
$EDITOR prompt.md
velix automations prompt set <id> --from-file prompt.md
```

## Common Workflows

### Run an automation and inspect the result

```bash
velix automations list --json | jq '.[] | {id, name}'
velix automations run <id> --json
velix automations get <id> --json
```

## Tips

1. **Always use `--json`** when scripting or running as an agent — `--json` output is consistent per-command.
2. **`auth whoami` before anything else** — most failures trace back to an empty `organizationId` in config or an expired token.

## Troubleshooting

- **"No active organization"**: run `velix organization list && velix organization switch <id>`.
- **"Host is offline / error connecting to host"**: the host's relay tunnel is not connected. Check to make sure both the cli and the target machine are on the latest versions of Velix.
