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
