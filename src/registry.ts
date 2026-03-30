import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import MiniSearch, { type SearchResult } from "minisearch";
import { parse as parseYaml } from "yaml";
import type { AgentRecord, DivisionSummary } from "./types.js";

interface IndexedAgent extends AgentRecord {
  id: number;
}

type AgentSearchResult = SearchResult & AgentRecord;

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function parseFrontmatter(raw: string): Record<string, unknown> {
  const match = raw.match(FRONTMATTER_RE);
  if (!match?.[1]) return {};
  const frontmatter = match[1];
  try {
    return parseYaml(frontmatter) ?? {};
  } catch {
    // Malformed YAML (e.g. unquoted colons) — extract top-level keys manually
    const result: Record<string, string> = {};
    for (const line of frontmatter.split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0)
        result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return result;
  }
}

const DIVISIONS = [
  "engineering",
  "design",
  "marketing",
  "sales",
  "project-management",
  "testing",
  "support",
  "specialized",
  "game-development",
  "spatial-computing",
  "paid-media",
  "academic",
  "strategy",
] as const satisfies readonly string[];

const DESCRIPTION_LIMIT = 150;

export function buildIndex(basePath: string): AgentRecord[] {
  const records: AgentRecord[] = [];

  for (const division of DIVISIONS) {
    const divPath = join(basePath, division);

    let entries: string[];
    try {
      entries = readdirSync(divPath).filter((f) => f.endsWith(".md"));
    } catch {
      console.error(
        `[agency] Warning: could not read division directory: ${divPath}`,
      );
      continue;
    }

    for (const file of entries) {
      const filePath = join(divPath, file);
      try {
        const raw = readFileSync(filePath, "utf-8");
        const data = parseFrontmatter(raw);

        const name = String(data.name || data.title || basename(file, ".md"));
        const description = data.description ? String(data.description) : "";
        const slug = basename(file, ".md");

        records.push({ slug, name, description, division, filePath });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message.split("\n")[0] : String(err);
        console.error(`[agency] Warning: skipping ${file} — ${msg}`);
      }
    }
  }

  return records;
}

// --- MiniSearch (BM25 with field boosting, fuzzy + prefix) ---

export type SearchIndex = MiniSearch<IndexedAgent>;

export function buildSearchIndex(records: AgentRecord[]): SearchIndex {
  const ms = new MiniSearch<IndexedAgent>({
    fields: ["name", "description", "division", "slug"],
    storeFields: ["slug", "name", "description", "division", "filePath"],
    searchOptions: {
      boost: { name: 3, division: 2, slug: 1.5 },
      prefix: true,
      fuzzy: 0.2,
    },
  });
  ms.addAll(records.map((r, i) => ({ ...r, id: i })));
  return ms;
}

function matchesDivision(division: string, candidate: string): boolean {
  return candidate.toLowerCase() === division.toLowerCase();
}

export function searchAgents(
  index: SearchIndex,
  records: AgentRecord[],
  query?: string,
  division?: string,
): AgentRecord[] {
  if (!query) {
    if (!division) return records;
    return records.filter((r) => matchesDivision(division, r.division));
  }

  if (division) {
    const filter = (result: SearchResult) =>
      matchesDivision(division, (result as AgentSearchResult).division);
    return index.search(query, { filter }) as AgentSearchResult[];
  }
  return index.search(query) as AgentSearchResult[];
}

function truncate(s: string, limit: number): string {
  return s.length > limit ? `${s.slice(0, limit)}…` : s;
}

export function formatAgentLine(r: AgentRecord, index?: number): string {
  const prefix = index != null ? `${index}. ` : "";
  return `${prefix}${r.name} (${r.division}) — ${truncate(r.description, DESCRIPTION_LIMIT)}\n   ${r.filePath}`;
}

export const LAUNCH_TEMPLATE = `Agent(prompt: "Read <file> — this is your system prompt. Follow it completely.\\n\\nTask: <describe the user's task>")`;

export function computeDivisions(records: AgentRecord[]): DivisionSummary[] {
  const grouped = Map.groupBy(records, (r) => r.division);
  return Array.from(grouped.entries())
    .map(([division, agents]) => ({
      division,
      count: agents.length,
      examples: agents.slice(0, 3).map((a) => a.name),
    }))
    .sort((a, b) => a.division.localeCompare(b.division));
}
