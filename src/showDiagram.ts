import * as vscode from "vscode";
import { computeDiagram } from "./diagram/computeDiagram";

const DIAGRAM_URL = vscode.Uri.parse("tsuml://preview");
let tsFile: vscode.TextDocument;
class DiagramViewer implements vscode.TextDocumentContentProvider {
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        const models = computeDiagram(tsFile);
        const printableModels = models.map((m) => ({
            memberGraph: m.memberGraph,
            name: m.name,
        }));
        return `
            <div>${tsFile.fileName} ${tsFile.lineCount} lines</div>
            <pre><code>${
                JSON.stringify(printableModels, undefined, 2)
            }</code></pre>
        `;
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
            vscode.ViewColumn.One,
            `${tsFile.fileName} diagram`,
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
