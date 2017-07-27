import * as ts from "typescript";
import { IDiagramEdge, IDiagramElement, IDiagramNode } from "./DiagramModel";
import { IGraphNode, NodeReferenceWalker } from "./NodeReferenceWalker";
import { getSymbolProperties } from "./symbolProperties";

interface IReferencesContext {
    sourceFile: ts.SourceFile;
    typechecker: ts.TypeChecker;
    references: {[fromTo: string]: IDiagramEdge};
    nodes: {[id: string]: IDiagramNode};
}

function getFileContext(fileName: string): IReferencesContext {
    const program = ts.createProgram([fileName], {});
    const sourceFile = program.getSourceFile(fileName);
    const typechecker = program.getTypeChecker();
    return {
        sourceFile,
        typechecker,
        references: {},
        nodes: {},
    };
}

function isLocal(parent: ts.Node, child: ts.NamedDeclaration) {
    const locals: ts.Map<ts.Symbol> = parent["locals"];
    if (!locals || !child.name || child.name.kind !== ts.SyntaxKind.Identifier) {
        return false;
    }
    if (!locals.has(child.name.text)) {
        return false;
    }
    const candidateLocal = locals.get(child.name.text);
    if (!candidateLocal.declarations || !candidateLocal.declarations.length) {
        return false;
    }
    const candidateNode = candidateLocal.declarations[0];
    return candidateNode.pos === child.pos && candidateNode.end === child.end;
}

function getIdentifierId(ctx: IReferencesContext, identifier: ts.Identifier): string | null {
    const symbol = ctx.typechecker.getSymbolAtLocation(identifier);
    if (!symbol || !symbol.declarations || !symbol.declarations.length) {
        return null;
    }
    let currNode = symbol.declarations[0] as ts.NamedDeclaration;
    const idParts: string[] = [];
    while (currNode) {
        if (isLocal(ctx.sourceFile, currNode)) {
            idParts.unshift(currNode.name.getText());
            idParts.unshift(ctx.sourceFile.fileName);
            return idParts.join(".");
        } else if (currNode.pos === ctx.sourceFile.pos && currNode.end === ctx.sourceFile.end) {
            idParts.unshift(ctx.sourceFile.fileName);
            return idParts.join(".");
        } else if (currNode.name && currNode.name.kind === ts.SyntaxKind.Identifier) {
            idParts.unshift(currNode.name.text);
        // } else if (currNode.kind === ts.SyntaxKind.Block) {
        //     break;
        }
        currNode = currNode.parent as ts.NamedDeclaration;
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
    let parentNode = symbol.declarations[0].parent as ts.NamedDeclaration;
    while (
        parentNode &&
        (!parentNode.name ||
        parentNode.name.kind !== ts.SyntaxKind.Identifier)
    ) {
        parentNode = parentNode.parent as ts.NamedDeclaration;
    }
    return parentNode && getIdentifierId(ctx, parentNode.name as ts.Identifier);
}

function getGraphNodeContainingPos(graphNodes: IGraphNode[], pos: number): IGraphNode | null {
    let currNode: IGraphNode | null = null;
    let currNodeLength: number = Infinity;
    for (const graphNode of graphNodes) {
        const node = graphNode.symbol.declarations[0];
        const nodeLength = node.end - node.pos;
        if (node.pos <= pos && node.end > pos && currNodeLength > nodeLength) {
            currNode = graphNode;
            currNodeLength = nodeLength;
        }
    }
    return currNode;
}

function createEdge(ctx: IReferencesContext, from: ts.Symbol, to: ts.Symbol, pos: number): IDiagramEdge | null {
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
    if (!fromId || !toId || fromId === toId) {
        return null;
    }
    const sourceFile = fromNode.getSourceFile();
    const lineChar = sourceFile.getLineAndCharacterOfPosition(pos);
    return {
        data: {
            id: `${fromId}-${toId}`,
            source: fromId,
            target: toId,
            references: [
                {
                    fileName: sourceFile.fileName,
                    line: lineChar.line + 1,
                    column: lineChar.character + 1,
                },
            ],
            weight: 1,
        },
    };
}

function getEdges(ctx: IReferencesContext, graphNodes: IGraphNode[]): IDiagramEdge[] {
    const edges: IDiagramEdge[] = [];
    for (const graphNode of graphNodes) {
        if (!graphNode.references || !graphNode.references.length) {
            continue;
        }
        for (const reference of graphNode.references[0].references) {
            const referencingNode = getGraphNodeContainingPos(graphNodes, reference.textSpan.start);
            if (!referencingNode) {
                continue;
            }
            const edge = createEdge(ctx, referencingNode.symbol, graphNode.symbol, reference.textSpan.start);

            if (edge) {
                if ( // Don't include parent-child references
                    edge.data.source === ctx.nodes[edge.data.target].data.parent ||
                    edge.data.target === ctx.nodes[edge.data.source].data.parent
                ) {
                    continue;
                }
                if (edge.data.id in ctx.references) {
                    ctx.references[edge.data.id].data.weight++;
                    ctx.references[edge.data.id].data.references.push(
                        ...edge.data.references,
                    );
                } else {
                    ctx.references[edge.data.id] = edge;
                    edges.push(edge);
                }
            }
        }
    }
    return edges;
}

function computeDiagram(
    ctx: IReferencesContext,
): IDiagramElement[] {
    const elements: IDiagramElement[] = [];

    const walker = new NodeReferenceWalker(ctx.sourceFile, ctx.typechecker);
    walker.walk(walker.sourceFile);
    const validNodes: IGraphNode[] = [];
    // Add nodes
    for (const graphNode of walker.graphNodes) {
        const id = getIdentifierId(ctx, graphNode.identifier);
        if (id) {
            const node: IDiagramNode = {
                data: {
                    id,
                    name: graphNode.identifier.text,
                    parent: getParentId(ctx, graphNode.symbol),
                    ...getSymbolProperties(graphNode.symbol),
                },
            };
            elements.push(node);
            ctx.nodes[node.data.id] = node;
            validNodes.push(graphNode);
        }
    }
    elements.push(...getEdges(ctx, validNodes));
    return elements;
}

export function computeDiagramForFile(fileName: string): IDiagramElement[] {
    const ctx: IReferencesContext = getFileContext(fileName);
    return computeDiagram(ctx);
}
