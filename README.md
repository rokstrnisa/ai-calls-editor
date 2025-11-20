# AI-calls-Editor

A prototype of a VS Code extension that exposes an MCP (Model Context Protocol) server over HTTP, allowing AI assistants (e.g. Claude Code) to perform IDE-powered refactoring operations.

## Installation

```bash
git clone https://github.com/rokstrnisa/ai-calls-editor.git
cd ai-calls-editor
pnpm install
pnpm compile
```

Press `F5` in VS Code to launch the Extension Development Host. The server starts automatically on port 7272 (configurable via `MCP_PORT` environment variable). Open the project you would like your AI assistant to work on.

## Setup

### Claude Code

```bash
claude mcp add --transport http ai-calls-editor http://localhost:7272/mcp
```

Now Claude Code will call the MCP server's `rename_symbol` tool when given an instruction such as:

```text
Rename the function foo in path src/utils.ts to bar.
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT - see [LICENSE](LICENSE).
