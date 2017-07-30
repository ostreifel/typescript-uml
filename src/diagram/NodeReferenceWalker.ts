import * as Lint from "tslint/lib/index";
import * as ts from "typescript";

function createLanguageServiceHost(fileName: string, source: string): ts.LanguageServiceHost {
    return {
        getCompilationSettings: () => ({}),
        getCurrentDirectory: () => "",
        getDefaultLibFileName: () => "lib.d.ts",
        getScriptFileNames: () => [fileName],
        getScriptSnapshot: (name: string) => ts.ScriptSnapshot.fromString(name === fileName ? source : ""),
        getScriptVersion: () => "1",
        log: () => { /* */ },
    };
}

function createLanguageService(fileName: string, source: string) {
    const languageServiceHost = createLanguageServiceHost(fileName, source);
    return ts.createLanguageService(languageServiceHost);
}

export interface IGraphNode {
    symbol: ts.Symbol;
    references: ts.ReferencedSymbol[];
}

export class NodeReferenceWalker extends Lint.SyntaxWalker {
    public readonly graphNodes: IGraphNode[] = [];

    private readonly languageService: ts.LanguageService;
    private inFunction: boolean = false;
    private inMethod: boolean = false;

    constructor(readonly sourceFile: ts.SourceFile) {
        super();
        this.languageService = createLanguageService(sourceFile.fileName, sourceFile.getFullText());
    }

    public visitConstructorDeclaration(node: ts.ConstructorDeclaration): void {
        this.storeNodeReferences(node);
        this.inMethod = true;
        super.visitConstructorDeclaration(node);
        this.inMethod = false;
    }

    public visitFunctionDeclaration(node: ts.FunctionDeclaration) {
        this.storeNodeReferences(node);
        const prev = this.inFunction;
        this.inFunction = true;
        super.visitFunctionDeclaration(node);
        this.inFunction = prev;
    }

    public visitImportDeclaration(node: ts.ImportDeclaration) {
        if (!Lint.hasModifier(node.modifiers, ts.SyntaxKind.ExportKeyword)) {
            const importClause = node.importClause;

            // named imports & namespace imports handled by other walker methods
            // importClause will be null for bare imports
            if (importClause != null) {
                this.storeNodeReferences(importClause);
            }
        }

        super.visitImportDeclaration(node);
    }

    public visitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration) {
        if (!Lint.hasModifier(node.modifiers, ts.SyntaxKind.ExportKeyword)) {
            this.storeNodeReferences(node);
        }
        super.visitImportEqualsDeclaration(node);
    }

    public visitInterfaceDeclaration(node: ts.InterfaceDeclaration) {
        this.storeNodeReferences(node);
        this.inMethod = true;
        super.visitInterfaceDeclaration(node);
        this.inMethod = false;
    }

    public visitMethodDeclaration(node: ts.MethodDeclaration) {
        this.storeNodeReferences(node);
        this.inMethod = true;
        super.visitMethodDeclaration(node);
        this.inMethod = false;
    }

    public visitModuleDeclaration(node: ts.ModuleDeclaration): void {
        this.storeNodeReferences(node);
        super.visitModuleDeclaration(node);
    }

    public visitNamedImports(node: ts.NamedImports) {
        for (const namedImport of node.elements) {
            this.storeNodeReferences(namedImport);
        }
        super.visitNamedImports(node);
    }

    public visitNamespaceImport(node: ts.NamespaceImport) {
        this.storeNodeReferences(node);
        super.visitNamespaceImport(node);
    }

    public visitPropertyDeclaration(node: ts.PropertyDeclaration) {
        if (!this.inMethod) {
            this.storeNodeReferences(node);
        }
        super.visitPropertyDeclaration(node);
    }
    public visitPropertySignature(node: ts.PropertySignature) {
        if (!this.inMethod) {
            this.storeNodeReferences(node);
        }
        super.visitPropertySignature(node);
    }

    public visitClassDeclaration(node: ts.ClassDeclaration): void {
        this.storeNodeReferences(node);
        super.visitClassDeclaration(node);
    }

    public visitBindingElement(node: ts.BindingElement) {
        if (!this.inFunction && !this.inMethod) {
            this.storeNodeReferences(node);
        }
        super.visitBindingElement(node);
    }

    public visitVariableDeclaration(node: ts.VariableDeclaration) {
        const isSingleVariable = node.name.kind === ts.SyntaxKind.Identifier;

        if (isSingleVariable && !this.inFunction && !this.inMethod) {
            this.storeNodeReferences(node);
        }

        super.visitVariableDeclaration(node);
    }
    private storeNodeReferences(node: ts.NamedDeclaration) {
        const position = node.name && node.name.kind === ts.SyntaxKind.Identifier ? node.name.getStart() : node.getStart();

        const fileName = this.sourceFile.fileName;
        const symbol: ts.Symbol = node["symbol"];
        // this.languageService.getDocumentHighlights(fileName, position, [fileName]);
        const references = this.languageService.findReferences(fileName, position);
        if (symbol) {
            this.graphNodes.push({
                symbol,
                references,
            });
        }
    }
}
