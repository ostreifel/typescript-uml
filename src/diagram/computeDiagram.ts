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

function getSymbolId(ctx: IReferencesContext, symbol: ts.Symbol): string | null {
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
        } else if (currNode["symbol"] && currNode["symbol"].getName()) {
            idParts.unshift(currNode["symbol"].getName());
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
    return parentNode && getSymbolId(ctx, parentNode["symbol"]);
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
    // const toNode = to.declarations[0] as ts.NamedDeclaration;

    const fromId = getSymbolId(ctx, from);
    const toId = getSymbolId(ctx, to);
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
    setStatus: (status: string) => void,
): IDiagramElement[] {
    const elements: IDiagramElement[] = [];

    setStatus("Walking ast...");
    const walker = new NodeReferenceWalker(ctx.sourceFile);
    walker.walk(walker.sourceFile);
    const validNodes: IGraphNode[] = [];
    setStatus("Computing nodes...");
    // Add nodes
    for (const graphNode of walker.graphNodes) {
        const id = getSymbolId(ctx, graphNode.symbol);
        if (id) {
            const node: IDiagramNode = {
                data: {
                    id,
                    name: graphNode.symbol.getName(),
                    parent: getParentId(ctx, graphNode.symbol),
                    ...getSymbolProperties(graphNode.symbol),
                },
            };
            elements.push(node);
            ctx.nodes[node.data.id] = node;
            validNodes.push(graphNode);
        }
    }
    setStatus("Computing edges...");
    elements.push(...getEdges(ctx, validNodes));
    return elements;
}

export function computeDiagramForFile(fileName: string, setStatus: (status: string) => void): IDiagramElement[] {
    const ctx: IReferencesContext = getFileContext(fileName);
    return computeDiagram(ctx, setStatus);
}
