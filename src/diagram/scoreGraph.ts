import SortedSet = require("collections/sorted-set");

/**
 * Gives a score for how well laid out a graph is. Higher is better.
 */
export function scoreGraph(eles: Cy.NodeCollection): number  {
    return scoreCrossingEdges(eles);
}

interface IEdgeReference {
    edge: Cy.EdgeCollection;
    point: Cy.Position;
}

function sortEdge(a: IEdgeReference, b: IEdgeReference) {
    const xComp = a.point.x - b.point.x;
    if (xComp !== 0) {
        return xComp > 0 ? 1 : -1;
    }
    const yComp = a.point.y - b.point.y;
    if (yComp !== 0) {
        return yComp > 0 ? 1 : -1;
    }
    if (a.edge.id < b.edge.id) {
        return -1;
    }
    if (a.edge.id > b.edge.id) {
        return 1;
    }
    return 0;
}

// These functions are to new to have proper type definitions
function getSource(edge: Cy.EdgeCollection): Cy.Position {
    return edge["sourceEndpoint"]();
}
function getTarget(edge: Cy.EdgeCollection): Cy.Position {
    return edge["sourceEndpoint"]();
}

/** Deduct for each time an edge crosses another edge */
function scoreCrossingEdges(eles: Cy.NodeCollection): number {
    const eventQueue = new SortedSet<IEdgeReference>([], (a, b) => sortEdge(a, b) === 0, sortEdge);
    // Initialize event queue EQ = all segment endpoints;
    // Sort EQ by increasing x and y;
    const edges = eles.connectedEdges();
    edges.forEach((edge) => {
        eventQueue.add({
            edge,
            point: getSource(edge),
        });
        eventQueue.add({
            edge,
            point: getTarget(edge),
        });
    });

    // Initialize sweep line SL to be empty;
    // Initialize output intersection list IL to be empty;

    // While (EQ is nonempty) {
    // while (eventQueue.N > 0) {

    // }
    //     Let E = the next event from EQ;
    //     If (E is a left endpoint) {
    //         Let segE = E's segment;
    //         Add segE to SL;
    //         Let segA = the segment Above segE in SL;
    //         Let segB = the segment Below segE in SL;
    //         If (I = Intersect( segE with segA) exists)
    //             Insert I into EQ;
    //         If (I = Intersect( segE with segB) exists)
    //             Insert I into EQ;
    //     }
    //     Else If (E is a right endpoint) {
    //         Let segE = E's segment;
    //         Let segA = the segment Above segE in SL;
    //         Let segB = the segment Below segE in SL;
    //         Delete segE from SL;
    //         If (I = Intersect( segA with segB) exists)
    //             If (I is not in EQ already)
    //                 Insert I into EQ;
    //     }
    //     Else {  // E is an intersection event
    //         Add E’s intersect point to the output list IL;
    //         Let segE1 above segE2 be E's intersecting segments in SL;
    //         Swap their positions so that segE2 is now above segE1;
    //         Let segA = the segment above segE2 in SL;
    //         Let segB = the segment below segE1 in SL;
    //         If (I = Intersect(segE2 with segA) exists)
    //             If (I is not in EQ already)
    //                 Insert I into EQ;
    //         If (I = Intersect(segE1 with segB) exists)
    //             If (I is not in EQ already)
    //                 Insert I into EQ;
    //     }
    //     remove E from EQ;
    // }
    // return IL;
    return 0;
}
