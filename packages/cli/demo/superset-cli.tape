# ─────────────────────────────────────────────────────────────
#  Velix CLI — punchy end-to-end walkthrough  (demo render)
#
#  Render with:  vhs demo/velix-cli.tape       (run from packages/cli)
#  Then add the soundtrack:  ./demo/add-sound.sh  (pad + keyboard clicks → velix-cli-sound.mp4)
#
#  Note: this is a *demo* — `velix` is shimmed in the hidden setup block
#  to print clean, canned output so the commands stay short and readable.
#  Nothing real runs; no auth, host, or network needed to render.
# ─────────────────────────────────────────────────────────────

Output demo/velix-cli.gif
Output demo/velix-cli.mp4

Set Shell "bash"
Set FontSize 33
Set Width 1980
Set Height 900
Set Padding 22
Set Margin 28
Set MarginFill "#0a0a0b"
Set BorderRadius 12
# Velix brand palette — burnt-orange accent on near-black (matches velix.sh)
Set Theme { "name": "Velix", "background": "#101012", "foreground": "#ECECEE", "cursor": "#E8804A", "selection": "#D2561140", "black": "#1C1C1F", "red": "#D25611", "green": "#6BB37E", "yellow": "#D2A24A", "blue": "#5B9BD5", "magenta": "#C97FD6", "cyan": "#56B6C2", "white": "#C8C8CC", "brightBlack": "#6B6B72", "brightRed": "#E8804A", "brightGreen": "#86D49B", "brightYellow": "#E8C07A", "brightBlue": "#7FB3E8", "brightMagenta": "#D896E4", "brightCyan": "#86D0DB", "brightWhite": "#FFFFFF" }
Set TypingSpeed 28ms
Set PlaybackSpeed 1.0

# --- setup (hidden from the final video) ---
Set TypingSpeed 2ms
Hide
Type `export PS1="\[\033[1;91m\]velix\[\033[0m\] \[\033[90m\]demo\[\033[0m\] \[\033[91m\]❯\[\033[0m\] "`
Enter
Type `velix() { case "$1.$2" in status.*) echo "Velix  ·  Kiets-Spaceship   running · healthy   ·  up 3h 12m"; printf '  endpoint  http://127.0.0.1:58968\n  org       Velix\n';; tasks.create) echo; echo "  ✓ Created  ENG-204  ·  Dark mode flickers on the dashboard"; echo "    · synced — already live in your Velix app";; tasks.list) printf 'ID       STATUS        PRIORITY   TITLE\nENG-204  todo          —          Dark mode flickers on the dashboard\nENG-201  in progress   medium     Stripe webhook retries on a 500\nENG-198  todo          low        Tidy the settings page copy\n';; tasks.update) echo; echo "  ✓ ENG-204  ·  priority is now urgent";; tasks.delete) echo "  ✓ Deleted  ENG-204";; agents.list) printf 'LABEL    PRESET   COMMAND\nClaude   claude   claude\nCodex    codex    codex\nCursor   cursor   cursor-agent\n';; workspaces.create) printf '\n  ✓ Created workspace  dark-mode-fix\n      branch   fix/dark-mode\n      agent    Claude — running, streaming live to your Velix app\n';; workspaces.open) echo; echo "  ✓ dark-mode-fix is now open in your Velix app — Claude is live there";; workspaces.delete) echo "  ✓ Deleted workspace  dark-mode-fix";; *) echo "velix: $*";; esac; }`
Enter
Type "clear"
Enter
Show
Set TypingSpeed 28ms

# --- the walkthrough ---
Sleep 600ms
Type "# 👋 The Velix CLI — drive your dev loop from the terminal."
Sleep 1.4s
Enter
Sleep 500ms
Type "#    ...or have your agents do it ;)"
Sleep 1.2s
Enter
Sleep 800ms
Type "# This machine's a host — workspaces run right here:"
Sleep 400ms
Enter
Sleep 250ms
Type "velix status"
Enter
Sleep 2.4s

Type "clear"
Enter
Sleep 300ms
Type "# A bug just landed — file it:"
Sleep 600ms
Enter
Sleep 300ms
Type `velix tasks create --title "Dark mode flickers on the dashboard"`
Enter
Sleep 2s
Type "velix tasks list"
Enter
Sleep 3s

Type "# This one's not waiting — bump it to urgent:"
Sleep 600ms
Enter
Sleep 300ms
Type "velix tasks update ENG-204 --priority urgent"
Enter
Sleep 2.4s

Type "clear"
Enter
Sleep 300ms
Type "# Which agent can fix it?"
Sleep 500ms
Enter
Sleep 300ms
Type "velix agents list"
Enter
Sleep 2.6s
Type "# Spin up a workspace running Claude on it — one command:"
Sleep 800ms
Enter
Sleep 350ms
Type `velix workspaces create --name dark-mode-fix --agent claude --prompt "fix the dark-mode flicker"`
Enter
Sleep 3s

Type "clear"
Enter
Sleep 300ms
Type "# Same workspace the desktop app shows — jump straight into it:"
Sleep 700ms
Enter
Sleep 350ms
Type "velix workspaces open dark-mode-fix"
Enter
Sleep 2.6s

Type "# Demo's done — clean up:"
Sleep 500ms
Enter
Sleep 300ms
Type "velix workspaces delete dark-mode-fix"
Enter
Sleep 1.6s
Type "velix tasks delete ENG-204"
Enter
Sleep 2.4s

Type "clear"
Enter
Sleep 300ms
Type "# Your agent runs this whole loop too."
Sleep 600ms
Enter
Sleep 300ms
Type "# Drop it into any coding agent:"
Sleep 400ms
Enter
Sleep 300ms
Type "#   npx skills add https://velix.sh"
Sleep 700ms
Enter
Sleep 250ms
Type "# ...or in Claude Code:"
Sleep 400ms
Enter
Sleep 250ms
Type "#   /plugin install velix@velix"
Sleep 1.4s
Enter
Sleep 700ms
Type "# File it, fix it, ship it — from your terminal.   velix.sh"
Sleep 1.2s
Enter
Sleep 3s
