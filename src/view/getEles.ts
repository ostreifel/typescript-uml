export function getNodes(
    eles: Cy.NodeCollection,
    filter: (n: Cy.NodeSingular) => boolean,
) {
    return eles.nodes(filter as any);
}
export function getEdges(
    eles: Cy.EdgeCollection,
    filter: (n: Cy.EdgeSingular) => boolean,
) {
    return eles.edges(filter as any);
}
