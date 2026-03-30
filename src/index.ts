#!/usr/bin/env node
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildIndex, buildSearchIndex, computeDivisions } from "./registry.js";
import { registerHandlers } from "./tools.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
);

// --- Configuration via environment variables ---

const REPO_URL =
  process.env.AGENCY_REPO_URL ||
  "https://github.com/msitarzewski/agency-agents.git";
const CACHE_DIR = join(
  process.env.XDG_CACHE_HOME || join(homedir(), ".cache"),
  "agency-mcp-server",
);
const DEFAULT_AGENTS_PATH = join(CACHE_DIR, "agency-agents");
const AUTO_UPDATE = process.env.AGENCY_AUTO_UPDATE !== "false";
const UPDATE_INTERVAL_MS =
  Number(process.env.AGENCY_UPDATE_INTERVAL || 24) * 60 * 60 * 1000;
const STAMP_FILE = join(CACHE_DIR, ".last-pull");

function isDirectory(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function shouldPull(): boolean {
  if (!AUTO_UPDATE) return false;
  try {
    const last = Number(readFileSync(STAMP_FILE, "utf-8"));
    if (Date.now() - last < UPDATE_INTERVAL_MS) return false;
  } catch {
    /* no stamp yet */
  }
  return true;
}

function markPulled(): void {
  writeFileSync(STAMP_FILE, String(Date.now()));
}

function ensureAgentsPath(): string {
  if (process.env.AGENCY_AGENTS_PATH) {
    const p = process.env.AGENCY_AGENTS_PATH;
    if (!isDirectory(p)) {
      console.error(
        `[agency] Fatal: AGENCY_AGENTS_PATH is not a valid directory: ${p}`,
      );
      process.exit(1);
    }
    return p;
  }

  // No env set — auto-fetch agent templates from configured repo
  if (existsSync(join(DEFAULT_AGENTS_PATH, ".git"))) {
    if (shouldPull()) {
      console.error(
        `[agency] Updating agent templates in ${DEFAULT_AGENTS_PATH}`,
      );
      try {
        execSync("git pull --ff-only", {
          cwd: DEFAULT_AGENTS_PATH,
          stdio: "ignore",
          timeout: 15_000,
        });
        markPulled();
      } catch {
        console.error(
          "[agency] Warning: git pull failed, using cached templates.",
        );
      }
    }
    return DEFAULT_AGENTS_PATH;
  }

  console.error(`[agency] Downloading agent templates from ${REPO_URL}`);
  mkdirSync(CACHE_DIR, { recursive: true });
  try {
    execSync(`git clone --depth 1 ${REPO_URL} ${DEFAULT_AGENTS_PATH}`, {
      stdio: "ignore",
      timeout: 30_000,
    });
    markPulled();
  } catch {
    console.error(
      "[agency] Fatal: Could not clone agent templates. Ensure git is installed, or set AGENCY_AGENTS_PATH manually.",
    );
    process.exit(1);
  }
  return DEFAULT_AGENTS_PATH;
}

const agentsPath = ensureAgentsPath();

console.error(`[agency] Scanning agents in: ${agentsPath}`);
const records = buildIndex(agentsPath);

if (records.length === 0) {
  console.error(
    "[agency] Fatal: No agents found. Check AGENCY_AGENTS_PATH points to a directory with agent markdown files.",
  );
  process.exit(1);
}

const searchIndex = buildSearchIndex(records);
const divisions = computeDivisions(records);

console.error(
  `[agency] Indexed ${records.length} agents across ${divisions.length} divisions.`,
);

const server = new McpServer({
  name: "agency",
  version: pkg.version,
});

registerHandlers(server, searchIndex, records, divisions);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[agency] MCP server v${pkg.version} running on stdio.`);
}

main().catch((error) => {
  console.error("[agency] Fatal error:", error);
  process.exit(1);
});
