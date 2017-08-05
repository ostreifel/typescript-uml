export interface IDiagramElement extends Cy.ElementDefinition {}

export interface IDiagramNode extends IDiagramElement, Cy.NodeDefinition {
    data: IDiagramNodeData;
}
export interface IDiagramNodeData extends Cy.NodeDataDefinition {
    id: string;
    name: string;
    parent?: string;
    filePosition: IDiagramFilePosition;
    lineCount: number;
    nodeSize: number;
    type: string;
}

export interface IDiagramEdge extends IDiagramElement, Cy.EdgeDefinition {
    data: IDiagramEdgeData;
}
export interface IDiagramEdgeData extends Cy.EdgeDataDefinition {
    id: string;
    source: string;
    target: string;
    weight: number;
    selectedWeight: number;
    references: IDiagramFilePosition[];
}

export interface IDiagramFilePosition {
    fileName: string;
    line: number;
    column: number;
}

export interface IDiagramModel extends Array<IDiagramEdge | IDiagramNode> { }
