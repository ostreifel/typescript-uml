import * as ts from "typescript";
import { IDiagramEdge, IDiagramElement, IDiagramNode } from "./DiagramModel";
import { NodeReferenceWalker } from "./NodeReferenceWalker";
import { getSymbolProperties } from "./symboProperties";

interface IReferencesContext {
    program: ts.Program;
    root: ts.Symbol;
    typechecker: ts.TypeChecker;
    references: {[fromTo: string]: IDiagramEdge};
    nodes: {[id: string]: IDiagramNode};
}

function getSymbolTable(fileName: string): IReferencesContext {
    const program = ts.createProgram([fileName], {});
    const sourceFile = program.getSourceFile(fileName);
    const typechecker = program.getTypeChecker();
    return {
        program,
        root: typechecker.getSymbolAtLocation(sourceFile),
        typechecker,
        references: {},
        nodes: {},
    };
}

function getValues<T>(m: ts.Map<T>): T[] {
    const values: T[] = [];
    m.forEach((v, k) => {
        values.push(v);
    });
    return values;
}

// tslint:disable-next-line:max-line-length
// TODO use https://github.com/palantir/tslint/blob/0b477310d27ca478af87ec6b0fff8314294e629a/src/rules/noUnusedVariableRule.ts
function childReferences(
    ctx: IReferencesContext,
    symbol: ts.Symbol,
    idPrefix: string,
    includeLocals?: boolean,
): IDiagramElement[] {
    const elements: IDiagramElement[] = [];
    if (symbol.exports) {
        getValues(symbol.exports).map((v) =>
            elements.push(...computeDiagram(ctx, v, idPrefix)),
        );
    }
    if (symbol.members) {
        getValues(symbol.members).map((v) =>
            elements.push(...computeDiagram(ctx, v, idPrefix)),
        );
    }
    if (includeLocals && symbol.valueDeclaration && symbol.valueDeclaration["locals"]) {
        getValues(symbol.valueDeclaration["locals"] as ts.Map<ts.Symbol>).map((v) => {
            elements.push(...computeDiagram(ctx, v, idPrefix));
            elements.push(...referencedNodes(ctx, v, idPrefix));
        });
    }
    return elements;
}

function getName(sym: ts.Symbol): string | null {
    if (!sym.declarations || !sym.declarations.length) {
        return null;
    }
    const named: ts.NamedDeclaration = sym.declarations[0];
    const ident: ts.Identifier = named.name as ts.Identifier;
    return ident && ident.text || null;
}

function walkChildren(node: ts.Node, visitor: (n: ts.Node) => void) {
    if (!node) {
        return;
    }
    node.forEachChild((child) => {
        visitor(child);
        walkChildren(child, visitor);
    });
}

function prependFileToRootLocal(ctx: IReferencesContext, id: string, symbol: ts.Symbol): string {
    if (
        !symbol ||
        !symbol.declarations ||
        !symbol.declarations.length ||
        !symbol.declarations[0].parent
    ) {
        return "";
    }
    const rootLocals: ts.Map<ts.Symbol> = ctx.root.valueDeclaration["locals"];
    if (rootLocals && !rootLocals.has(id.split(".")[0])) {
        return "";
    }
    return `${ctx.root.name}.${id}`;
}

function getIdentifierId(ctx: IReferencesContext, identifier: ts.Identifier): string | null {
    const symbol = ctx.typechecker.getSymbolAtLocation(identifier);
    if (!symbol || !symbol.declarations || !symbol.declarations.length) {
        return null;
    }
    let id = ctx.typechecker.getFullyQualifiedName(symbol);
    if (id.startsWith(ctx.root.name)) {
        return id;
    }
    id = prependFileToRootLocal(ctx, id, symbol);
    if (id.startsWith(ctx.root.name)) {
        return id;
    }

    return null;
}

function referencedNodes(ctx: IReferencesContext, sourceSymbol: ts.Symbol, sourceId: string): IDiagramEdge[] {
    const references: IDiagramEdge[] = [];
    const sourceName = getName(sourceSymbol);
    const source = `${sourceId}.${sourceName}`;
    walkChildren(sourceSymbol.valueDeclaration, (targetNode) => {
        if (targetNode.kind === ts.SyntaxKind.Identifier) {
            const ident = targetNode as ts.Identifier;
            const targetName = ident.text;
            // TODO handle shadowed method names
            if (targetName === sourceName) {
                return;
            }
            const target = getIdentifierId(ctx, ident);
            if (target) {
                const fromTo = `${source}-${target}`;
                if (fromTo in ctx.references) {
                    ctx.references[fromTo].data.weight++;
                } else {
                    const edge: IDiagramEdge = {
                        data: {
                            source,
                            target,
                            weight : 1,
                        },
                    };
                    references.push(edge);
                    ctx.references[fromTo] = edge;
                }
            }
        }
    });
    return references;
}

function inheritenceElement(
    ctx: IReferencesContext,
    symbol: ts.Symbol,
    idPrefix: string,
    name: string,
    includeLocals: boolean,
) {
    const elements: IDiagramElement[] = [];
    elements.push({
        data: {
            id: `${idPrefix}.${name}`,
            name,
            ...getSymbolProperties(symbol),
        },
    });
    function pushSymbolTable(table: ts.Map<ts.Symbol>) {
        getValues(table).map((v) => {
            const vName = getName(v);
            if (!vName) {
                return;
            }
            elements.push(...[
                {
                    data: {
                        id: `${idPrefix}.${name}.${vName}`,
                        name: vName,
                        parent: `${idPrefix}.${name}`,
                        ...getSymbolProperties(v),
                    },
                },
            ]);
            elements.push(...referencedNodes(ctx, v, `${idPrefix}.${name}`));
        });
    }
    if (symbol.exports) {
        pushSymbolTable(symbol.exports);
    }
    if (symbol.members) {
        pushSymbolTable(symbol.members);
    }
    if (
        includeLocals &&
        symbol.valueDeclaration &&
        symbol.valueDeclaration["locals"]
    ) {
        pushSymbolTable(symbol.valueDeclaration["locals"]);
    }
    return elements;
}

function computeDiagram(
    ctx: IReferencesContext,
    fileSymbol: ts.Symbol,
    idPrefix: string = ctx.root.name,
): IDiagramElement[] {
    const elements: IDiagramElement[] = [];

    const walker = new NodeReferenceWalker(ctx.root.valueDeclaration as ts.SourceFile, ctx.typechecker);
    walker.walk(walker.sourceFile);
    for (const {symbol, identifier} of walker.graphNodes) {
        const id = getIdentifierId(ctx, identifier);
        if (id) {
            elements.push({
                data: {
                    id,
                    name: identifier.text,
                    ...getSymbolProperties(symbol),
                },
            });
        }
    }

    // const symName = getName(fileSymbol);
    // if (fileSymbol.flags & ts.SymbolFlags.ValueModule) {
    //     elements.push(...childReferences(ctx, fileSymbol, idPrefix, fileSymbol.name === ctx.root.name));
    // } else if (
    //     fileSymbol.flags & ts.SymbolFlags.ModuleMember
    //     && symName
    // ) {
    //     elements.push(...inheritenceElement(ctx, fileSymbol, idPrefix, symName, fileSymbol.name === ctx.root.name));
    // }
    return elements;
}

export function computeDiagramForFile(fileName: string): IDiagramElement[] {
    const ctx: IReferencesContext = getSymbolTable(fileName);
    return computeDiagram(ctx, ctx.root);
}
