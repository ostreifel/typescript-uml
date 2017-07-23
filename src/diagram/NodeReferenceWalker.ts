import * as Lint from "tslint/lib/index";
import * as ts from "typescript";

const CHECK_PARAMETERS: boolean = false;

const REACT_MODULES = ["react", "react/addons"];
const REACT_NAMESPACE_IMPORT_NAME = "React";

const MODULE_SPECIFIER_MATCH = /^["'](.+)['"]$/;

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

    private skipBindingElement: boolean;
    private skipParameterDeclaration: boolean = false;

    private hasSeenJsxElement: boolean = false;
    private isReactUsed: boolean = false;
    private reactImport: ts.NamespaceImport;

    private readonly languageService: ts.LanguageService;

    constructor(readonly sourceFile: ts.SourceFile, private readonly typechecker: ts.TypeChecker) {
        super();
        this.languageService = createLanguageService(sourceFile.fileName, sourceFile.getFullText());
    }

    public visitBindingElement(node: ts.BindingElement) {
        const isSingleVariable = node.name.kind === ts.SyntaxKind.Identifier;

        if (isSingleVariable && !this.skipBindingElement) {
            const variableIdentifier = node.name as ts.Identifier;
            this.storeIdentifierReference(variableIdentifier);
        }

        super.visitBindingElement(node);
    }

    public visitCatchClause(node: ts.CatchClause) {
        // don't visit the catch clause variable declaration, just visit the block
        // the catch clause variable declaration needs to be there but doesn't need to be used
        this.visitBlock(node.block);
    }

    public visitFunctionDeclaration(node: ts.FunctionDeclaration) {
        this.storeIdentifierReference(node.name);

        super.visitFunctionDeclaration(node);
    }

    public visitFunctionType(node: ts.FunctionOrConstructorTypeNode) {
        this.skipParameterDeclaration = true;
        super.visitFunctionType(node);
        this.skipParameterDeclaration = false;
    }

    public visitImportDeclaration(node: ts.ImportDeclaration) {
        if (!Lint.hasModifier(node.modifiers, ts.SyntaxKind.ExportKeyword)) {
            const importClause = node.importClause;

            // named imports & namespace imports handled by other walker methods
            // importClause will be null for bare imports
            if (importClause != null && importClause.name != null) {
                const variableIdentifier = importClause.name;
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

    // skip parameters in index signatures (stuff like [key: string]: string)
    public visitIndexSignatureDeclaration(node: ts.IndexSignatureDeclaration) {
        this.skipParameterDeclaration = true;
        super.visitIndexSignatureDeclaration(node);
        this.skipParameterDeclaration = false;
    }

    // skip parameters in interfaces
    public visitInterfaceDeclaration(node: ts.InterfaceDeclaration) {
        this.skipParameterDeclaration = true;
        this.storeIdentifierReference(node.name);
        super.visitInterfaceDeclaration(node);
        this.skipParameterDeclaration = false;
    }

    public visitJsxElement(node: ts.JsxElement) {
        this.hasSeenJsxElement = true;
        super.visitJsxElement(node);
    }

    public visitJsxSelfClosingElement(node: ts.JsxSelfClosingElement) {
        this.hasSeenJsxElement = true;
        super.visitJsxSelfClosingElement(node);
    }

    public visitMethodDeclaration(node: ts.MethodDeclaration) {
        if (node.name != null && node.name.kind === ts.SyntaxKind.Identifier) {
            const modifiers = node.modifiers;
            const variableName = (node.name as ts.Identifier).text;

            this.storeIdentifierReference(node.name);
        }

        // abstract methods can't have a body so their parameters are always unused
        if (Lint.hasModifier(node.modifiers, ts.SyntaxKind.AbstractKeyword)) {
            this.skipParameterDeclaration = true;
        }
        super.visitMethodDeclaration(node);
        this.skipParameterDeclaration = false;
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
        const importDeclaration = node.parent.parent as ts.ImportDeclaration;
        const moduleSpecifier = importDeclaration.moduleSpecifier.getText();

        // extract the unquoted module being imported
        const moduleNameMatch = moduleSpecifier.match(MODULE_SPECIFIER_MATCH);
        const isReactImport = (moduleNameMatch != null) && (REACT_MODULES.indexOf(moduleNameMatch[1]) !== -1);

        if (isReactImport && node.name.text === REACT_NAMESPACE_IMPORT_NAME) {
            this.reactImport = node;
            const fileName = this.sourceFile.fileName;
            const position = node.name.getStart();
            const highlights = this.languageService.getDocumentHighlights(fileName, position, [fileName]);
            if (highlights != null && highlights[0].highlightSpans.length > 1) {
                this.isReactUsed = true;
            }
        } else {
            this.storeIdentifierReference(node.name);
        }
        super.visitNamespaceImport(node);
    }

    public visitParameterDeclaration(node: ts.ParameterDeclaration) {
        const isSingleVariable = node.name.kind === ts.SyntaxKind.Identifier;
        const isPropertyParameter = Lint.hasModifier(
            node.modifiers,
            ts.SyntaxKind.PublicKeyword,
            ts.SyntaxKind.PrivateKeyword,
            ts.SyntaxKind.ProtectedKeyword,
        );

        if (!isSingleVariable && isPropertyParameter) {
            // tsc error: a parameter property may not be a binding pattern
            this.skipBindingElement = true;
        }

        if (CHECK_PARAMETERS
                && isSingleVariable
                && !this.skipParameterDeclaration
                && !Lint.hasModifier(node.modifiers, ts.SyntaxKind.PublicKeyword)) {
            const nameNode = node.name as ts.Identifier;
            this.storeIdentifierReference(nameNode);
        }

        super.visitParameterDeclaration(node);
        this.skipBindingElement = false;
    }

    // check private member variables
    public visitPropertyDeclaration(node: ts.PropertyDeclaration) {
        if (node.name && node.name.kind === ts.SyntaxKind.Identifier) {
            const modifiers = node.modifiers;
            const variableName = (node.name as ts.Identifier).text;

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
        const name = identifier.text;
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
