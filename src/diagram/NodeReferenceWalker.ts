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
    identifier: ts.Identifier;
    references: ts.ReferencedSymbol[];
}

export class NodeReferenceWalker extends Lint.SyntaxWalker {
    public readonly graphNodes: IGraphNode[] = [];

    private readonly languageService: ts.LanguageService;

    constructor(readonly sourceFile: ts.SourceFile, private readonly typechecker: ts.TypeChecker) {
        super();
        this.languageService = createLanguageService(sourceFile.fileName, sourceFile.getFullText());
    }

    public visitBlock(node: ts.Block): void {
        // skip
    }

    public visitBindingElement(node: ts.BindingElement) {
        const isSingleVariable = node.name.kind === ts.SyntaxKind.Identifier;

        if (isSingleVariable) {
            const variableIdentifier = node.name as ts.Identifier;
            this.storeIdentifierReference(variableIdentifier);
        }

        super.visitBindingElement(node);
    }

    public visitFunctionDeclaration(node: ts.FunctionDeclaration) {
        this.storeIdentifierReference(node.name);
        super.visitFunctionDeclaration(node);
    }

    public visitImportDeclaration(node: ts.ImportDeclaration) {
        if (!Lint.hasModifier(node.modifiers, ts.SyntaxKind.ExportKeyword)) {
            const importClause = node.importClause;

            // named imports & namespace imports handled by other walker methods
            // importClause will be null for bare imports
            if (importClause != null && importClause.name != null) {
                this.storeIdentifierReference(importClause.name);
            }
        }

        super.visitImportDeclaration(node);
    }

    public visitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration) {
        if (!Lint.hasModifier(node.modifiers, ts.SyntaxKind.ExportKeyword)) {
            const name = node.name;
            this.storeIdentifierReference(name);
        }
        super.visitImportEqualsDeclaration(node);
    }

    public visitInterfaceDeclaration(node: ts.InterfaceDeclaration) {
        this.storeIdentifierReference(node.name);
        super.visitInterfaceDeclaration(node);
    }

    public visitMethodDeclaration(node: ts.MethodDeclaration) {
        if (node.name != null && node.name.kind === ts.SyntaxKind.Identifier) {
            this.storeIdentifierReference(node.name);
        }
        super.visitMethodDeclaration(node);
    }

    public visitModuleDeclaration(node: ts.ModuleDeclaration): void {
        if (node.name != null && node.name.kind === ts.SyntaxKind.Identifier) {
            this.storeIdentifierReference(node.name);
        }
        super.visitModuleDeclaration(node);
    }

    public visitNamedImports(node: ts.NamedImports) {
        for (const namedImport of node.elements) {
            this.storeIdentifierReference(namedImport.name);
        }
        super.visitNamedImports(node);
    }

    public visitNamespaceImport(node: ts.NamespaceImport) {
        this.storeIdentifierReference(node.name);
        super.visitNamespaceImport(node);
    }

    public visitPropertyDeclaration(node: ts.PropertyDeclaration) {
        if (node.name && node.name.kind === ts.SyntaxKind.Identifier) {
            this.storeIdentifierReference(node.name);
        }

        super.visitPropertyDeclaration(node);
    }
    public visitPropertySignature(node: ts.PropertySignature) {
        if (node.name && node.name.kind === ts.SyntaxKind.Identifier) {
            this.storeIdentifierReference(node.name as ts.Identifier);
        }
        super.visitPropertySignature(node);
    }

    public visitClassDeclaration(node: ts.ClassDeclaration): void {
        this.storeIdentifierReference(node.name);
        super.visitClassDeclaration(node);
    }

    public visitVariableDeclaration(node: ts.VariableDeclaration) {
        const isSingleVariable = node.name.kind === ts.SyntaxKind.Identifier;

        if (isSingleVariable) {
            const variableIdentifier = node.name as ts.Identifier;
            this.storeIdentifierReference(variableIdentifier);
        }

        super.visitVariableDeclaration(node);
    }
    private storeIdentifierReference(identifier: ts.Identifier) {
        const position = identifier.getStart();

        const fileName = this.sourceFile.fileName;
        const symbol = this.typechecker.getSymbolAtLocation(identifier);
        // this.languageService.getDocumentHighlights(fileName, position, [fileName]);
        const references = this.languageService.findReferences(fileName, position);
        if (symbol) {
            this.graphNodes.push({
                symbol,
                identifier,
                references,
            });
        }
    }
}
