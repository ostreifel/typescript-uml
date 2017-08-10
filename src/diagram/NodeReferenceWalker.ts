import * as Lint from "tslint/lib/index";
import * as ts from "typescript";

function createLanguageServiceHost(fileName: string, source: string): ts.LanguageServiceHost {
    return {
        getCompilationSettings: () => ({allowJs: true}),
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
    private inConstructor: boolean = false;

    constructor(readonly sourceFile: ts.SourceFile) {
        super();
        this.languageService = createLanguageService(sourceFile.fileName, sourceFile.getFullText());
    }

    public visitConstructorDeclaration(node: ts.ConstructorDeclaration): void {
        this.storeNodeReferences(node);
        const prev = this.inConstructor;
        this.inConstructor = true;
        super.visitConstructorDeclaration(node);
        this.inConstructor = prev;
    }

    public visitFunctionDeclaration(node: ts.FunctionDeclaration) {
        this.storeNodeReferences(node);
        const prev = this.inFunction;
        this.inFunction = true;
        super.visitFunctionDeclaration(node);
        this.inFunction = prev;
    }

    public visitFunctionExpression(node: ts.FunctionExpression): void {
        if (node.name) {
            this.storeNodeReferences(node);
        }
        const prev = this.inFunction;
        this.inFunction = true;
        super.visitFunctionExpression(node);
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
        super.visitInterfaceDeclaration(node);
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
        if (!this.inMethod && !this.inConstructor) {
            this.storeNodeReferences(node);
        }
        super.visitPropertyDeclaration(node);
    }
    public visitPropertySignature(node: ts.PropertySignature) {
        if (!this.inMethod && !this.inConstructor) {
            this.storeNodeReferences(node);
        }
        super.visitPropertySignature(node);
    }

    public visitMethodSignature(node: ts.SignatureDeclaration): void {
        this.storeNodeReferences(node);
        super.visitMethodSignature(node);
    }

    public visitClassDeclaration(node: ts.ClassDeclaration): void {
        this.storeNodeReferences(node);
        super.visitClassDeclaration(node);
    }
    public visitTypeAliasDeclaration(node: ts.TypeAliasDeclaration): void {
        this.storeNodeReferences(node);
        super.visitTypeAliasDeclaration(node);
    }

    public visitBindingElement(node: ts.BindingElement) {
        if (!this.inFunction && !this.inMethod && !this.inConstructor) {
            this.storeNodeReferences(node);
        }
        super.visitBindingElement(node);
    }

    public visitParameterDeclaration(node: ts.ParameterDeclaration): void {
        const isPropertyParameter = Lint.hasModifier(
            node.modifiers,
            ts.SyntaxKind.PublicKeyword,
            ts.SyntaxKind.PrivateKeyword,
            ts.SyntaxKind.ProtectedKeyword,
            ts.SyntaxKind.ReadonlyKeyword,
        );
        if (this.inConstructor && isPropertyParameter) {
            this.storeNodeReferences(node);
        }
        super.visitParameterDeclaration(node);
    }

    public visitVariableDeclaration(node: ts.VariableDeclaration) {
        const isSingleVariable = node.name.kind === ts.SyntaxKind.Identifier;

        if (isSingleVariable && !this.inFunction && !this.inMethod && !this.inConstructor) {
            this.storeNodeReferences(node);
        }

        super.visitVariableDeclaration(node);
    }
    public visitEnumDeclaration(node: ts.EnumDeclaration): void {
        this.storeNodeReferences(node);
        super.visitEnumDeclaration(node);
    }
    public visitEnumMember(node: ts.EnumMember): void {
        this.storeNodeReferences(node);
        super.visitEnumMember(node);
    }
    private storeNodeReferences(node: ts.NamedDeclaration) {
        const position = node.name && node.name.kind === ts.SyntaxKind.Identifier ? node.name.getStart() : node.getStart();

        const fileName = this.sourceFile.fileName;
        const symbol: ts.Symbol = node["symbol"];
        const references = this.languageService.findReferences(fileName, position);
        if (symbol) {
            this.graphNodes.push({
                symbol,
                references,
            });
        }
    }
}
