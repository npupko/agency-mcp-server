# agency-mcp-server

## The Problem

AI coding agents (Claude Code, Cursor, Windsurf, etc.) are general-purpose by default. When you need a specialist — a game economy designer, a security auditor, a technical writer — you're on your own: find the right system prompt, figure out how to wire it up as a subagent, and repeat the next time you need a different one.

[agency-agents](https://github.com/msitarzewski/agency-agents) solved the template problem: 140+ battle-tested agent prompts organized by division. But discovering and launching the right agent still requires manual browsing and copy-pasting.

## What This Solves

This MCP server turns that static collection into a searchable, zero-config service. Your AI assistant can search for the right specialist, get the spawn instructions, and launch it — all in one flow, without you leaving your editor.

```
You: "Help me design a balanced game economy"
Claude: [searches agency → finds Game Economy Designer → spawns subagent → delivers expert response]
```

No manual template hunting. No copy-paste. Just describe what you need.

## Quick Start

Add to your MCP config (`~/.claude/settings.json`, Cursor settings, etc.):

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

That's it. On first run, the server automatically clones the [agency-agents](https://github.com/msitarzewski/agency-agents) templates to `~/.cache/agency-mcp-server/` and keeps them updated on subsequent launches.

### Custom Agent Templates

To use your own agent templates instead of (or alongside) the community collection:

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

All settings are environment variables, configured in your MCP server config:

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENCY_AGENTS_PATH` | `~/.cache/agency-mcp-server/agency-agents` | Path to agent templates. When unset, templates are auto-cloned from the repo |
| `AGENCY_REPO_URL` | `https://github.com/msitarzewski/agency-agents.git` | Git repo to clone templates from. Use your own fork or a private repo |
| `AGENCY_AUTO_UPDATE` | `true` | Set to `false` to disable automatic `git pull` on startup |
| `AGENCY_UPDATE_INTERVAL` | `24` | Hours between auto-update checks |

### Examples

**Use a private fork, update daily (default):**

```json
{
  "mcpServers": {
    "agency": {
      "command": "npx",
      "args": ["-y", "agency-mcp-server"],
      "env": {
        "AGENCY_REPO_URL": "https://github.com/yourorg/custom-agents.git"
      }
    }
  }
}
```

**Pin templates, never auto-update:**

```json
{
  "mcpServers": {
    "agency": {
      "command": "npx",
      "args": ["-y", "agency-mcp-server"],
      "env": {
        "AGENCY_AUTO_UPDATE": "false"
      }
    }
  }
}
```

### Agent Directory Structure

```
agents/
  engineering/
    software-architect.md
    frontend-developer.md
  design/
    ui-designer.md
  game-development/
    game-mechanics-designer.md
  ...
```

Each `.md` file uses YAML front-matter for metadata:

```yaml
---
name: Software Architect
description: Expert software architect specializing in system design...
---

(Full agent system prompt)
```

## MCP Capabilities

### Tools

**`agency_search`** — Find agents by task description. Returns matches with file paths and a spawn template.

```
agency_search(query: "game mechanics", division?: "game-development")
```

**`agency_browse`** — Explore the registry. Lists divisions or agents within a division.

```
agency_browse(division?: "engineering")
```

### Resources

- **`agency://agents`** — Full agent index as JSON (attach via `@agency:agency://agents` for zero-tool-call browsing)
- **`agency://divisions`** — Division summary with counts and examples

### Prompts

- **`use-agent`** — One-shot: describe a task, get the best agent match with spawn instructions

## Development

```bash
# Install dependencies
npm install

# Type-check
npm run typecheck

# Build
npm run build

# Run with auto-fetched templates
node dist/index.js

# Run with custom templates
AGENCY_AGENTS_PATH=./my-agents node dist/index.js

# Test with MCP Inspector
npm run inspect
```

## Credits

Agent templates from [agency-agents](https://github.com/msitarzewski/agency-agents) by [@msitarzewski](https://github.com/msitarzewski).

## License

MIT
