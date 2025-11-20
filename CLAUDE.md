# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

AI-calls-Editor is a VS Code extension that exposes an MCP server over HTTP with the aim to enable AI assistants to perform IDE-powered refactoring operations.

It currently provides a `rename_symbol` tool that uses VS Code's rename provider to rename symbols.

## Architecture

- **Extension Entry Point** (`src/extension.ts`): Activates on startup, runs Express HTTP server on port 7272.
- **MCP Server**: Built with `@modelcontextprotocol/sdk`, registers `rename_symbol` tool.
- **HTTP Transport**: `StreamableHTTPServerTransport` handles MCP requests via `POST /mcp`.
- **Rename Implementation**: Calls `vscode.executeDocumentRenameProvider`, applies and saves workspace edits.

Endpoints:

- `POST /mcp` - MCP protocol.
- `GET /healthz` - Health check.

## Development Commands

```bash
pnpm compile    # Build
pnpm watch      # Watch mode
pnpm format     # Lint
pnpm test       # Run tests
```

Debug: Use "Run Extension" launch config (F5) to open Extension Development Host.

## Implementation Details

- Uses 1-based line/column (converts to 0-based for VS Code API).
- `resolveToWorkspace` handles absolute and workspace-relative paths.
- Workspace edits auto-saved after application.
- MCP server lifecycle tied to extension context subscriptions.
