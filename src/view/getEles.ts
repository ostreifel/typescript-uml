export function getNodes(
    eles: Cy.NodeCollection,
    filter: (n: Cy.NodeCollection) => boolean,
) {
    return eles.nodes(filter as any);
}
export function getEdges(
    eles: Cy.EdgeCollection,
    filter: (n: Cy.EdgeCollection) => boolean,
) {
    return eles.edges(filter as any);
}
export function getEles(
    eles: Cy.CollectionElements,
    filter: (n: Cy.CollectionElements) => boolean,
) {
    return eles.filter(filter as any);
}
