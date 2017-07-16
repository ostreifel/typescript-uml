export interface IDiagramNode {
    data: {
        id: string;
        name: string;
    };
}

export interface IDiagramEdge {
    data: {
        source: string;
        target: string;
    };
}

export interface IDiagramModel extends Array<IDiagramEdge | IDiagramNode> { }
