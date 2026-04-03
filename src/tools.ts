import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createIndexState,
  formatAgentLine,
  LAUNCH_TEMPLATE,
  searchAgents,
} from "./registry.js";
import type { IndexState } from "./types.js";

function textResult(text: string, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    ...(isError && { isError: true }),
  };
}

export interface HandlerContext {
  agentsPath: string;
  isLocalPath: boolean;
  updateIntervalMs: number;
  lastPullTimestamp: () => number | null;
  shouldPull: () => boolean;
  pullRepo: () => void;
}

export function registerHandlers(
  server: McpServer,
  state: IndexState,
  ctx: HandlerContext,
): void {
  function divisionList() {
    return state.divisions.map((d) => `${d.division} (${d.count})`).join(", ");
  }

  const readOnlyAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  } as const;

  // --- Tools ---

  server.tool(
    "agency_search",
    [
      "Find and launch a specialized agent for any task.",
      "<usecase>Search agent templates by keyword. Returns matching agents with file paths and a spawn template. Call this before spawning any agency subagent.</usecase>",
      "<instructions>",
      "1. Pass a task description as query (e.g. 'game mechanics', 'security audit')",
      "2. Pick the best match from results",
      "3. Spawn a subagent using the template at the bottom — replace <file> with the file path and <describe the user's task> with the user's full, unabridged request",
      "4. Return the subagent's response directly to the user without summarizing it",
      "</instructions>",
    ].join("\n"),
    {
      query: z
        .string()
        .describe(
          "Task or keyword to search for (e.g. 'game mechanics', 'frontend React', 'security audit')",
        ),
      division: z
        .string()
        .optional()
        .describe(
          "Optional: narrow to a division (e.g. 'engineering', 'game-development')",
        ),
    },
    readOnlyAnnotations,
    async ({ query, division }) => {
      const matches = searchAgents(
        state.searchIndex,
        state.records,
        query,
        division,
      );

      if (matches.length === 0) {
        return textResult(
          `No agents matched "${query}"${division ? ` in division "${division}"` : ""}.\n\nAvailable divisions: ${divisionList()}\n\n→ Try broader keywords or use agency_browse to explore.`,
          true,
        );
      }

      const top = matches.slice(0, 5);

      return textResult(
        [
          `Found ${matches.length} match${matches.length === 1 ? "" : "es"}:\n`,
          ...top.map((r, i) => formatAgentLine(r, i + 1)),
          `\n→ Pick the best match and spawn:\n  ${LAUNCH_TEMPLATE}`,
        ].join("\n"),
      );
    },
  );

  server.tool(
    "agency_browse",
    [
      "Browse all agent divisions and their agents.",
      "<usecase>Explore the agent registry when you want to see what's available. Use agency_search instead if you already know what kind of agent you need.</usecase>",
      "<instructions>Call with no arguments to see all divisions. Pass a division name to list its agents.</instructions>",
    ].join("\n"),
    {
      division: z
        .string()
        .optional()
        .describe("Division to list agents for (omit to see all divisions)"),
    },
    readOnlyAnnotations,
    async ({ division }) => {
      if (!division) {
        const lines = state.divisions.map(
          (d) =>
            `${d.division} (${d.count} agents) — e.g. ${d.examples.join(", ")}`,
        );
        return textResult(
          [
            `${state.records.length} agents across ${state.divisions.length} divisions:\n`,
            ...lines,
            `\n→ agency_browse(division: "<name>") to list agents in a division`,
            `→ agency_search(query: "<task>") to find the right agent directly`,
          ].join("\n"),
        );
      }

      const agents = searchAgents(
        state.searchIndex,
        state.records,
        undefined,
        division,
      );
      if (agents.length === 0) {
        return textResult(
          `Division "${division}" not found. Available: ${divisionList()}`,
          true,
        );
      }

      return textResult(
        [
          `${agents.length} agents in "${division}":\n`,
          ...agents.map((r, i) => formatAgentLine(r, i + 1)),
          `\n→ agency_search(query: "<task>") to find the best match and get launch instructions`,
        ].join("\n"),
      );
    },
  );

  server.tool(
    "agency_status",
    "Check the current status of the agent index — last update time, whether an update is available, and agent count.",
    {},
    readOnlyAnnotations,
    async () => {
      const stamp = ctx.lastPullTimestamp();
      const lastPull = stamp !== null ? new Date(stamp).toISOString() : "never";
      const updateAvailable = ctx.shouldPull();

      const lines = [
        `Agent count: ${state.records.length}`,
        `Divisions: ${state.divisions.length}`,
        `Source: ${ctx.agentsPath}`,
        `Source type: ${ctx.isLocalPath ? "local path (AGENCY_AGENTS_PATH)" : "git repo"}`,
        `Last updated: ${lastPull}`,
        `Update interval: ${ctx.updateIntervalMs / 3_600_000}h`,
        `Update available: ${updateAvailable ? "yes" : "no (within interval)"}`,
      ];

      if (ctx.isLocalPath) {
        lines.push(
          `\nNote: Using local path. "agency_update" will re-scan the directory without git pull.`,
        );
      }

      return textResult(lines.join("\n"));
    },
  );

  server.tool(
    "agency_update",
    "Pull latest agent templates from git (if applicable) and rebuild the search index.",
    {},
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    } as const,
    async () => {
      const oldCount = state.records.length;

      if (!ctx.isLocalPath) {
        try {
          ctx.pullRepo();
        } catch {
          return textResult(
            "Git pull failed. Index was not updated. Check network connectivity and try again.",
            true,
          );
        }
      }

      const fresh = createIndexState(ctx.agentsPath);
      Object.assign(state, fresh);

      const newCount = state.records.length;
      const diff = newCount - oldCount;
      const diffStr =
        diff === 0
          ? "no change"
          : diff > 0
            ? `+${diff} new`
            : `${diff} removed`;

      try {
        server.sendResourceListChanged();
      } catch {
        /* client may not support notifications */
      }

      return textResult(
        [
          "Index updated successfully.",
          `Agents: ${oldCount} → ${newCount} (${diffStr})`,
          `Divisions: ${state.divisions.length}`,
          ctx.isLocalPath
            ? "Re-scanned local directory."
            : "Pulled latest from git and rebuilt index.",
        ].join("\n"),
      );
    },
  );

  // --- Resources ---

  server.registerResource(
    "agents",
    "agency://agents",
    {
      title: "Agent Index",
      description:
        "Full index of all agent templates with names, descriptions, divisions, and file paths",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "agency://agents",
          mimeType: "application/json",
          text: state.agentsJson,
        },
      ],
    }),
  );

  server.registerResource(
    "divisions",
    "agency://divisions",
    {
      title: "Agent Divisions",
      description: "List of all agent divisions with counts and examples",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "agency://divisions",
          mimeType: "application/json",
          text: state.divisionsJson,
        },
      ],
    }),
  );

  // --- Prompts ---

  server.registerPrompt(
    "use-agent",
    {
      title: "Use Agency Agent",
      description: "Find the best agent for a task and get spawn instructions",
      argsSchema: {
        task: z
          .string()
          .describe(
            "What you need help with (e.g. 'design a game economy', 'audit security')",
          ),
        division: z.string().optional().describe("Optional division filter"),
      },
    },
    async ({ task, division }) => {
      const matches = searchAgents(
        state.searchIndex,
        state.records,
        task,
        division,
      );
      const top = matches.slice(0, 3);

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                top.length === 0
                  ? `Find and use the best agency agent for this task: ${task}\n\nNo agents matched. Available divisions: ${divisionList()}\n\nTry broader keywords.`
                  : `Find and use the best agency agent for this task: ${task}\n\nTop matches:\n${top.map((r, i) => formatAgentLine(r, i + 1)).join("\n")}\n\n${LAUNCH_TEMPLATE}`,
            },
          },
        ],
      };
    },
  );
}
