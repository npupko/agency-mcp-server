# agency-mcp-server

## Why

Claude Code, Cursor, and similar tools are generalists. Sometimes you need a specialist — someone who knows game economy design, or security auditing, or technical writing. That means finding the right system prompt, wiring it up, and doing it again next time for a different task.

[agency-agents](https://github.com/msitarzewski/agency-agents) has 140+ of these prompts, organized by division. They ship install scripts that copy everything into your tool's config. It works, but:

- You still have to browse the repo to figure out which agent fits your task
- 140+ agents get dumped into your config — most of them irrelevant to what you're doing right now
- Templates are static copies. Updates mean re-running the installer
- Switching tools means re-running it again

This MCP server does it differently. Instead of copying files around, it's a search service. You describe what you need, your assistant finds the right agent and spawns it. One config entry, no manual browsing.

```
You: "Help me design a balanced game economy"
Claude: [searches → finds Game Economy Designer → spawns it → you get an expert response]
```

It auto-fetches the templates on first run and keeps them updated. You don't touch a thing.

## Quick Start

Add this to your MCP config (`~/.claude/settings.json`, Cursor settings, etc.):

```json
{
  "mcpServers": {
    "agency": {
      "command": "npx",
      "args": ["-y", "agency-mcp-server"]
    }
  }
}
```

First launch clones [agency-agents](https://github.com/msitarzewski/agency-agents) to `~/.cache/agency-mcp-server/`. After that it pulls updates every 24 hours.

### Custom templates

Point it at your own directory instead:

```json
{
  "mcpServers": {
    "agency": {
      "command": "npx",
      "args": ["-y", "agency-mcp-server"],
      "env": {
        "AGENCY_AGENTS_PATH": "/path/to/your/agent-templates"
      }
    }
  }
}
```

## Configuration

Everything is an env var in your MCP config:

| Variable | Default | What it does |
|----------|---------|--------------|
| `AGENCY_AGENTS_PATH` | `~/.cache/agency-mcp-server/agency-agents` | Path to agent templates. Unset = auto-clone from repo |
| `AGENCY_REPO_URL` | `https://github.com/msitarzewski/agency-agents.git` | Repo to clone from. Point this at your fork |
| `AGENCY_AUTO_UPDATE` | `true` | Set `false` to never pull updates |
| `AGENCY_UPDATE_INTERVAL` | `24` | Hours between update checks |

**Use your own fork:**

```json
{
  "env": {
    "AGENCY_REPO_URL": "https://github.com/yourorg/custom-agents.git"
  }
}
```

**Pin templates, skip updates entirely:**

```json
{
  "env": {
    "AGENCY_AUTO_UPDATE": "false"
  }
}
```

### Template format

Markdown files with YAML front-matter, organized by division:

```
agents/
  engineering/
    software-architect.md
  design/
    ui-designer.md
  game-development/
    game-mechanics-designer.md
```

```yaml
---
name: Software Architect
description: Expert software architect specializing in system design...
---

(Full agent system prompt below)
```

## What's exposed over MCP

**Tools:**

- `agency_search(query, division?)` — find agents by task description, get spawn instructions
- `agency_browse(division?)` — list divisions, or list agents in a division

**Resources:**

- `agency://agents` — full index as JSON (attach via `@agency:agency://agents` to skip the tool call)
- `agency://divisions` — division summary with counts

**Prompts:**

- `use-agent` — describe a task, get the best match with ready-to-go spawn instructions

## Development

```bash
npm install
npm run typecheck
npm run build

# Run with auto-fetched templates
node dist/index.js

# Run with your own
AGENCY_AGENTS_PATH=./my-agents node dist/index.js

# MCP Inspector
npm run inspect
```

## Credits

Agent templates from [agency-agents](https://github.com/msitarzewski/agency-agents) by [@msitarzewski](https://github.com/msitarzewski).

## License

MIT
