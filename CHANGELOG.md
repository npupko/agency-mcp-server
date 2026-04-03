# agency-mcp-server

## 0.3.1

### Patch Changes

- [`a93a636`](https://github.com/npupko/agency-mcp-server/commit/a93a636016d50b3c6a62eb8eb9f06d9dba4a0d8f) Thanks [@npupko](https://github.com/npupko)! - Fix biome lint errors in tools.ts

## 0.3.0

### Minor Changes

- [`8606b84`](https://github.com/npupko/agency-mcp-server/commit/8606b84b140b73c32b213f28447cf0818a75ba51) Thanks [@npupko](https://github.com/npupko)! - Add `agency_status` and `agency_update` tools for runtime index management

## 0.2.2

### Patch Changes

- [`1a49b1f`](https://github.com/npupko/agency-mcp-server/commit/1a49b1fcb3ff48e09637d7410d6c8b85d194b258) Thanks [@npupko](https://github.com/npupko)! - Add mcpName field and server.json for Official MCP Registry publishing

## 0.2.1

### Patch Changes

- [`7369f53`](https://github.com/npupko/agency-mcp-server/commit/7369f5369bae3753b0109108ca6e09f7edc66ea2) Thanks [@npupko](https://github.com/npupko)! - Replace inline CJS script with jq for jsr.json version sync

## 0.2.0

### Minor Changes

- [#1](https://github.com/npupko/agency-mcp-server/pull/1) [`9d4921a`](https://github.com/npupko/agency-mcp-server/commit/9d4921aa1d9f09ee31aac4979aad37845ee73823) Thanks [@npupko](https://github.com/npupko)! - Modernize to ES2024 and Node 22 best practices

  - **BREAKING**: Minimum Node.js version raised from 18 to 22 (Node 18 reached EOL April 2025)
  - Target ES2024, enabling native `Map.groupBy` and `import.meta.dirname`
  - Add stricter TypeScript options: `verbatimModuleSyntax`, `exactOptionalPropertyTypes`, `moduleDetection: "force"`
  - Add Biome rules: `useImportType` and `noDefaultExport`
