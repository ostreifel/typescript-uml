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

function getFileContext(fileName: string): IReferencesContext {
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

function getParentId(ctx: IReferencesContext, symbol: ts.Symbol): string | null {
    if (
        !symbol ||
        !symbol.declarations ||
        !symbol.declarations.length ||
        !symbol.declarations[0].parent
    ) {
        return null;
    }
    const parentNode = symbol.declarations[0].parent as ts.NamedDeclaration;
    if (
        !parentNode.name ||
        parentNode.name.kind !== ts.SyntaxKind.Identifier
    ) {
        return null;
    }
    return getIdentifierId(ctx, parentNode.name);
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
                    parent: getParentId(ctx, symbol),
                    ...getSymbolProperties(symbol),
                },
            });
        }
    }
    return elements;
}

export function computeDiagramForFile(fileName: string): IDiagramElement[] {
    const ctx: IReferencesContext = getFileContext(fileName);
    return computeDiagram(ctx, ctx.root);
}
