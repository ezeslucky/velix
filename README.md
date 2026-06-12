# Velix — Orchestrate AI Coding Agents in Parallel

Run Claude Code, Codex, Gemini CLI, Cursor Agent, and more across isolated git worktrees — with built-in review, terminal, and editor workflows.

> Ship faster with parallel AI development.


---

## Why Velix?

Most AI coding tools are designed around a single-agent workflow.

Velix is built for developers who want to run multiple AI coding agents simultaneously without losing control of their repository.

With Velix you can:

* Run many coding agents in parallel
* Isolate every task using git worktrees
* Compare outputs safely
* Review changes quickly
* Switch context instantly
* Keep your main repository clean

---

## Features

| Feature                      | Description                                             |
| :--------------------------- | :------------------------------------------------------ |
| **Parallel Agent Execution** | Run 10+ coding agents simultaneously                    |
| **Git Worktree Isolation**   | Every task gets its own isolated branch and workspace   |
| **Built-in Diff Viewer**     | Review and edit AI-generated changes quickly            |
| **Agent Monitoring**         | Track task progress in real time                        |
| **Workspace Presets**        | Automate setup, installs, and environment configuration |
| **IDE Integration**          | Open any workspace instantly in your editor             |
| **Universal Compatibility**  | Works with any CLI-based coding agent                   |
| **Quick Context Switching**  | Move between tasks without losing focus                 |

---

## Supported Agents

Velix works with any CLI-based coding agent.

| Agent            | Status                |
| :--------------- | :-------------------- |
| Claude Code      | ✅ Fully Supported     |
| OpenAI Codex CLI | ✅ Fully Supported     |
| Gemini CLI       | ✅ Fully Supported     |
| Cursor Agent     | ✅ Fully Supported     |
| GitHub Copilot   | ✅ Fully Supported     |
| Amp Code         | ✅ Fully Supported     |
| OpenCode         | ✅ Fully Supported     |
| Pi               | ✅ Fully Supported     |
| Any CLI Agent    | ✅ Works Automatically |

> If it runs in a terminal, it runs on Velix.

---

## Quick Start

### Clone the Repository

```bash
git clone https://github.com/ezeslucky/velix.git
cd velix
```

### Install Dependencies

```bash
bun install
```

### Configure Environment

```bash
cp .env.example .env
```

Optional quick local setup:

```bash
echo 'SKIP_ENV_VALIDATION=1' >> .env
```

### Run Development Server

```bash
bun run dev
```

### Build Desktop App

```bash
bun run build
open apps/desktop/release
```

---

## Requirements

| Requirement   | Details                            |
| :------------ | :--------------------------------- |
| OS            | macOS (Windows/Linux experimental) |
| Runtime       | Bun v1.0+                          |
| Git           | Git 2.20+                          |
| GitHub CLI    | gh                                 |
| Reverse Proxy | Caddy                              |

---

## Caddy Setup

Velix uses Caddy for secure local streaming support.

### Install Caddy

```bash
brew install caddy
```

### Configure

```bash
cp Caddyfile.example Caddyfile
```

### Trust Local Certificates

```bash
caddy trust
```

Without this, Chromium may reject secure localhost connections.

---

## Workspace Automation

Velix supports automatic workspace setup and teardown workflows.

Example configuration:

```json
{
  "setup": ["./.velix/setup.sh"],
  "teardown": ["./.velix/teardown.sh"]
}
```

### Example Setup Script

```bash
#!/bin/bash

# Copy environment variables
cp ../.env .env

# Install dependencies
bun install

echo "Workspace ready!"
```

Available environment variables:

* `VELIX_WORKSPACE_NAME`
* `VELIX_ROOT_PATH`

---

## Use Cases

* Run feature development in parallel
* Compare Claude vs Codex outputs
* Generate tests while building features
* Refactor safely in isolated environments
* Review AI-generated diffs before merging
* Run experimental changes without affecting main code

---

## Architecture

```text
User
  ↓
Velix
  ↓
Git Worktree
  ↓
AI Coding Agent
  ↓
Diff Review + Merge
```

---

## Project Structure

```text
apps/
  desktop/
  web/

packages/
  ui/
  core/
  shared/
```

---

## Tech Stack

* Electron
* React
* TailwindCSS
* Bun
* Turborepo
* Vite
* Biome
* Drizzle ORM
* Neon
* tRPC

---

## Mastra Dependencies

This repository uses the upstream `mastracode` and `@mastra/*` packages directly.

Avoid custom tarball overrides unless there is a repository-specific blocker.

---

## Roadmap

* [ ] Windows support
* [ ] Linux support
* [ ] Team collaboration
* [ ] Cloud sync
* [ ] Multi-repository orchestration
* [ ] Agent templates
* [ ] Built-in terminal multiplexing
* [ ] Remote workspace execution

---

## Private by Default

* Full source available under Elastic License 2.0 (ELv2)
* Explicit integrations only
* Local-first workflow
* Your repositories stay under your control

---

## Contributing

Contributions are welcome.

### Development Workflow

```bash
git checkout -b feature/amazing-feature
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

Then open a Pull Request.

You can also open GitHub Issues for bugs, ideas, or feature requests.

---


## Community

* Twitter — Follow for updates and announcements
* GitHub Discussions — Ask questions and share ideas
* GitHub Issues — Report bugs and request features

---

## License

Velix is source-available under the Elastic License 2.0 (ELv2).

You may use, modify, and self-host Velix, but you may not offer it as a competing hosted service.

See `LICENSE.md` for more information.
