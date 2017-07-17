export interface IDiagramElement {}

export interface IDiagramNode extends IDiagramElement {
    data: {
        id: string;
        name: string;
    };
}

export interface IDiagramEdge extends IDiagramElement {
    data: {
        source: string;
        target: string;
    };
}

export interface IDiagramModel extends Array<IDiagramEdge | IDiagramNode> { }
