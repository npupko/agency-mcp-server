# agency-mcp-server

[![npm version](https://img.shields.io/npm/v/agency-mcp-server)](https://www.npmjs.com/package/agency-mcp-server)
[![JSR](https://jsr.io/badges/@npupko/agency-mcp-server)](https://jsr.io/@npupko/agency-mcp-server)
[![CI](https://github.com/npupko/agency-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/npupko/agency-mcp-server/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> One MCP config entry. 150+ specialist agents on demand. No manual setup.

Your AI assistant is a generalist. Sometimes you need a specialist -- a game economy designer, a security auditor, a technical writer. This MCP server gives your assistant instant access to 150+ expert agent templates. Describe what you need, it finds the right agent and spawns it.

```
You: "Help me design a balanced game economy"
Claude: [searches -> finds Game Economy Designer -> spawns it -> expert response]
```

Templates auto-fetch on first run from [agency-agents](https://github.com/msitarzewski/agency-agents) and stay updated. You don't touch a thing.

## Quick Start

### Claude Code

As a plugin:

```bash
/plugin marketplace add npupko/agency-mcp-server
/plugin install agency@agency-mcp-server
```

Or via CLI:

```bash
claude mcp add agency -- npx -y agency-mcp-server
```

### Cursor, Windsurf, and other MCP clients

Add to your MCP config:

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

That's it. First launch clones templates to `~/.cache/agency-mcp-server/` and pulls updates every 24 hours.

## How It Works

Your assistant gets two tools:

1. **`agency_search(query, division?)`** -- describe a task, get matching agents with spawn instructions
2. **`agency_browse(division?)`** -- explore divisions and agents when you want to see what's available

When you ask for help with something specific, your assistant calls `agency_search`, picks the best match, and spawns a subagent with that specialist's full system prompt. You get an expert response without ever touching a config file.

### What's available

Agents are organized into divisions:

| Division | Examples |
|----------|----------|
| Engineering | Software Architect, DevOps Engineer, Technical Writer |
| Design | UI Designer, UX Researcher, Design Systems |
| Game Development | Game Economy Designer, Game Mechanics Designer |
| Marketing | Content Strategist, SEO Specialist, Email Marketing |
| Security & Specialized | Security Auditor, Data Scientist, Legal Analyst |
| ...and more | Academic, Sales, Strategy, Support, Testing, Spatial Computing |

## Configuration

All configuration is through environment variables in your MCP config:

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENCY_AGENTS_PATH` | `~/.cache/agency-mcp-server/agency-agents` | Path to agent templates. Set this to use your own templates instead of auto-cloning |
| `AGENCY_REPO_URL` | `https://github.com/msitarzewski/agency-agents.git` | Git repo to clone templates from. Point at your fork |
| `AGENCY_AUTO_UPDATE` | `true` | Set to `false` to disable automatic pulls |
| `AGENCY_UPDATE_INTERVAL` | `24` | Hours between update checks |

### Use your own templates

Point at a local directory:

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

Or clone from your own repo:

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

### Template format

Each agent is a Markdown file with YAML front-matter, organized by division:

```
engineering/
  software-architect.md
  devops-engineer.md
design/
  ui-designer.md
game-development/
  game-economy-designer.md
```

```yaml
---
name: Software Architect
description: Expert software architect specializing in system design...
---

Full agent system prompt goes here.
```

The server indexes the `name` and `description` fields for search. The full Markdown body becomes the agent's system prompt when spawned.

## MCP Interface

### Tools

- **`agency_search(query, division?)`** -- find agents by task description, returns matches with file paths and a ready-to-use spawn template
- **`agency_browse(division?)`** -- list all divisions, or list agents within a specific division

### Resources

- **`agency://agents`** -- full agent index as JSON
- **`agency://divisions`** -- division list with counts and examples

### Prompts

- **`use-agent`** -- describe a task, get the best-matching agent with spawn instructions

## Development

```bash
npm install
npm run build

# Run with auto-fetched templates
node dist/index.js

# Run with local templates
AGENCY_AGENTS_PATH=./my-agents node dist/index.js

# Type checking
npm run typecheck

# MCP Inspector
npm run inspect
```

## Credits

Agent templates from [agency-agents](https://github.com/msitarzewski/agency-agents) by [@msitarzewski](https://github.com/msitarzewski).

## License

MIT
