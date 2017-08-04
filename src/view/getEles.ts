export function getNodes(
    eles: Cy.NodeCollection,
    filter: (n: Cy.NodeCollection) => boolean,
) {
    // tslint:disable-next-line:no-any
    return eles.nodes(filter as any);
}
export function getEdges(
    eles: Cy.EdgeCollection,
    filter: (n: Cy.EdgeCollection) => boolean,
) {
    // tslint:disable-next-line:no-any
    return eles.edges(filter as any);
}
export function getEles(
    eles: Cy.CollectionElements,
    filter: (n: Cy.CollectionElements) => boolean,
) {
    // tslint:disable-next-line:no-any
    return eles.filter(filter as any);
}
