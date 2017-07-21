import * as ts from "typescript";
import { IDiagramEdge, IDiagramElement, IDiagramNode } from "./DiagramModel";
import { IGraphNode, NodeReferenceWalker } from "./NodeReferenceWalker";
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

function getGraphNodeContainingPos(graphNodes: IGraphNode[], pos: number): IGraphNode | null {
    for (const graphNode of graphNodes) {
        const node = graphNode.symbol.declarations[0];
        if (node.pos <= pos && node.end > pos) {
            return graphNode;
        }
    }
    return null;
}

function createEdge(ctx: IReferencesContext, from: ts.Symbol, to: ts.Symbol): IDiagramEdge | null {
    if (
        !from || !to ||
        !from.declarations || !to.declarations ||
        !from.declarations.length || !to.declarations.length
    ) {
        return null;
    }
    const fromNode = from.declarations[0] as ts.NamedDeclaration;
    const toNode = to.declarations[0] as ts.NamedDeclaration;
    if (
        !fromNode.name ||
        fromNode.name.kind !== ts.SyntaxKind.Identifier ||
        !toNode.name ||
        toNode.name.kind !== ts.SyntaxKind.Identifier
    ) {
        return null;
    }
    const fromIdent = fromNode.name as ts.Identifier;
    const toIdent = toNode.name as ts.Identifier;

    const fromId = getIdentifierId(ctx, fromIdent);
    const toId = getIdentifierId(ctx, toIdent);
    if (!fromId || !toId) {
        return null;
    }
    return {
        data: {
            source: fromId,
            target: toId,
            weight: 1,
        },
    };
}

function getEdges(ctx: IReferencesContext, graphNodes: IGraphNode[]): IDiagramEdge[] {
    const edges: IDiagramEdge[] = [];
    for (const graphNode of graphNodes) {
        for (const {kind, textSpan} of graphNode.highlights) {
            const referencingNode = getGraphNodeContainingPos(graphNodes, textSpan.start);
            if (!referencingNode) {
                continue;
            }
            const edge = createEdge(ctx, graphNode.symbol, referencingNode.symbol);
            if (edge) {
                edges.push(edge);
            }
        }
    }
    return edges;
}

function computeDiagram(
    ctx: IReferencesContext,
    fileSymbol: ts.Symbol,
    idPrefix: string = ctx.root.name,
): IDiagramElement[] {
    const elements: IDiagramElement[] = [];

    const walker = new NodeReferenceWalker(ctx.root.valueDeclaration as ts.SourceFile, ctx.typechecker);
    walker.walk(walker.sourceFile);
    const validNodes: IGraphNode[] = [];
    // Add nodes
    for (const graphNode of walker.graphNodes) {
        const id = getIdentifierId(ctx, graphNode.identifier);
        if (id) {
            elements.push({
                data: {
                    id,
                    name: graphNode.identifier.text,
                    parent: getParentId(ctx, graphNode.symbol),
                    ...getSymbolProperties(graphNode.symbol),
                },
            });
            validNodes.push(graphNode);
        }
    }
    elements.push(...getEdges(ctx, validNodes));
    return elements;
}

export function computeDiagramForFile(fileName: string): IDiagramElement[] {
    const ctx: IReferencesContext = getFileContext(fileName);
    return computeDiagram(ctx, ctx.root);
}
