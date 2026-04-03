export interface AgentRecord {
  slug: string;
  name: string;
  description: string;
  division: string;
  filePath: string;
}

export interface DivisionSummary {
  division: string;
  count: number;
  examples: string[];
}

export interface IndexState {
  records: AgentRecord[];
  searchIndex: import("./registry.js").SearchIndex;
  divisions: DivisionSummary[];
  agentsJson: string;
  divisionsJson: string;
}
