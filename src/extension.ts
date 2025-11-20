import vscode from "vscode";
import path from "path";
import express from "express";
import z from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export async function activate(context: vscode.ExtensionContext) {
    async function renameSymbol(file: string, line: number, column: number, name: string) {
        const absPath = resolveToWorkspace(file);
        const uri = vscode.Uri.file(absPath);
        const position = new vscode.Position(line - 1, column - 1);

        const edit: vscode.WorkspaceEdit | undefined = await vscode.commands.executeCommand(
            "vscode.executeDocumentRenameProvider",
            uri,
            position,
            name,
        );

        const result = { applied: false, files: [] as string[], editCount: 0 };
        if (edit !== undefined && edit.size > 0) {
            await vscode.workspace.applyEdit(edit);
            await vscode.workspace.saveAll();
            result.applied = true;
            result.editCount = edit.size;
            result.files = edit.entries().map(([uri]) => uri.fsPath);
        }
        return result;
    }

    const mcp = new McpServer({ name: "ai-calls-editor", version: "0.1.0" });

    mcp.registerTool(
        "rename_symbol",
        {
            title: "Rename a symbol (variable, function, class, etc.)",
            description:
                "Uses VS Code's efficient rename provider (LSP-backed). Use 1-based line/column. " +
                "Pass a file path relative to the workspace (or absolute).",
            inputSchema: {
                file: z.string(),
                line: z.number().int().min(1),
                column: z.number().int().min(1),
                name: z.string().min(1),
            },
            outputSchema: {
                applied: z.boolean(),
                editCount: z.number().int(),
                files: z.array(z.string()),
            },
        },
        async ({ file, line, column, name }) => {
            const result = await renameSymbol(file, line, column, name);
            return {
                content: [
                    {
                        type: "text",
                        text: `applied=${result.applied}\nedits=${
                            result.editCount
                        }\nfiles:\n${result.files.join("\n")}`,
                    },
                ],
                structuredContent: result,
            };
        },
    );

    const app = express();
    app.use(express.json());
    app.get("/healthz", (_request, response) => response.json({ ok: true }));
    app.post("/mcp", async (request, response) => {
        const transport = new StreamableHTTPServerTransport({
            enableJsonResponse: true,
            sessionIdGenerator: undefined,
        });
        response.on("close", () => transport.close());
        await mcp.connect(transport);
        await transport.handleRequest(request, response, request.body);
    });
    const port = parseInt(process.env.MCP_PORT || "7272", 10);
    const server = app.listen(port, () => {
        vscode.window.showInformationMessage(`AI-calls-Editor is ready at http://localhost:${port}/mcp.`);
    });

    context.subscriptions.push({ dispose: () => server.close() });
}

export function deactivate() {}

function resolveToWorkspace(filePath: string): string {
    if (path.isAbsolute(filePath)) {
        return filePath;
    }
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    if (workspaceFolders.length === 0) {
        throw new Error("No workspace folder is open.");
    }
    return path.join(workspaceFolders[0].uri.fsPath, filePath);
}
