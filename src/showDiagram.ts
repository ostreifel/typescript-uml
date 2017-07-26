import { spawn } from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { ctx } from "./extension";

let tsFile: vscode.TextDocument;

export function registerDiagram(): vscode.Disposable[] {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    const showDiagram = vscode.commands.registerCommand("tsuml.show", () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        tsFile = editor.document;
        if (!tsFile) {
            return;
        }
        spawn(
            path.join(ctx.extensionPath, "node_modules", "electron", "dist", "electron.exe"),
            [
                path.join(ctx.extensionPath, "out", "src", "view", "main.js"),
                ctx.extensionPath,
                tsFile.fileName,
            ],
            {
                env: {},
            },
        );
    });
    return [showDiagram];
}
