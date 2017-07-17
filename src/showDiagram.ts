import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { computeDiagramForFile } from "./diagram/computeReferences";
import { ctx } from "./extension";

const DIAGRAM_URL = vscode.Uri.parse("tsuml://preview");
let tsFile: vscode.TextDocument;

function replaceAll(original: string, target: string, replacement: string): string {
    return original.split(target).join(replacement);
}

class DiagramViewer implements vscode.TextDocumentContentProvider {
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        const diagram = computeDiagramForFile(tsFile.fileName);
        return this.getHtml(ctx.extensionPath, diagram);
    }
    private getHtml(rootPath: string, models: any): string {
        const tplPath: string = path.join(ctx.extensionPath, "html");
        const tplPreviewPath = path.join(tplPath, "diagram.html");
        let contents = fs.readFileSync(tplPreviewPath, "utf-8");
        contents = replaceAll(contents, "${rootPath}", rootPath);
        contents = replaceAll(contents, "${models}", JSON.stringify(models));
        return contents;
    }
}
const diagramViewer = new DiagramViewer();
export function registerDiagram(): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];
    disposables.push(vscode.workspace.registerTextDocumentContentProvider("tsuml", diagramViewer));
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

        return vscode.commands.executeCommand("vscode.previewHtml",
            DIAGRAM_URL,
            vscode.window.activeTextEditor.viewColumn,
            `${path.parse(tsFile.fileName).base} diagram`,
        ).then(
            (success) => {
                // update preview
                // if (config.previewAutoUpdate) this.startWatch(); else this.stopWatch();
                // this.update(true);
                return;
            },
            (reason) => {
                vscode.window.showErrorMessage(reason);
            },
        );
    });
    return disposables;
}
