import { getNodes } from "./getEles";

export function searchNodes(nodes: Cy.NodeCollection, searchString: string): Cy.NodeCollection | null {
    if (!searchString) {
        return null;
    }
    searchString = searchString.toLocaleLowerCase();
    function idx(n: Cy.NodeCollection) {
        return n.data("name").toLocaleLowerCase().indexOf(searchString);
    }
    const foundNodes = getNodes(nodes, (n) => {
        return idx(n) >= 0;
    });
    const sortedNodes = foundNodes.sort((a, b) => {
        const idxComp = idx(a) - idx(b);
        if (idxComp !== 0) {
            return idxComp;
        }
        return b.length - a.length;
    });
    return sortedNodes;
}
