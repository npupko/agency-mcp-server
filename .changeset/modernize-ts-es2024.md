---
"agency-mcp-server": minor
---

Modernize to ES2024 and Node 22 best practices

- **BREAKING**: Minimum Node.js version raised from 18 to 22 (Node 18 reached EOL April 2025)
- Target ES2024, enabling native `Map.groupBy` and `import.meta.dirname`
- Add stricter TypeScript options: `verbatimModuleSyntax`, `exactOptionalPropertyTypes`, `moduleDetection: "force"`
- Add Biome rules: `useImportType` and `noDefaultExport`
