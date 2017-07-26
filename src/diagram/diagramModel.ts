export interface IDiagramElement extends Cy.ElementDefinition {}

export interface IDiagramNode extends IDiagramElement {
    data: {
        id: string;
        name: string;
        parent?: string;
    };
}

export interface IDiagramEdge extends IDiagramElement {
    data: {
        id: string;
        source: string;
        target: string;
        weight: number;
    };
}

export interface IDiagramModel extends Array<IDiagramEdge | IDiagramNode> { }
