export interface IDiagramElement extends Cy.ElementDefinition {}

export interface IDiagramNode extends IDiagramElement, Cy.NodeDefinition {
    data: IDiagramNodeData;
}
export interface IDiagramNodeData extends Cy.NodeDataDefinition {
    id: string;
    name: string;
    parent?: string;
    shape: Cy.Css.NodeShape;
    filePosition: IDiagramFilePosition;
    lineCount: number;
    nodeSize: number;
    /** CSS color value */
    color: string;
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
    references: IDiagramFilePosition[];
}

export interface IDiagramFilePosition {
    fileName: string;
    line: number;
    column: number;
}

export interface IDiagramModel extends Array<IDiagramEdge | IDiagramNode> { }
