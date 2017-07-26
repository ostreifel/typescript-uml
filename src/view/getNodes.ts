export function getNodes(eles: Cy.NodeCollection, filter: (n: Cy.NodeSingular) => boolean) {
    return eles.nodes(filter as any);
}
