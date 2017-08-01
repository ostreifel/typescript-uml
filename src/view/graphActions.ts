
import { getNodes } from "./getEles";
import { Action } from "./undoRedo";

export interface IPositionDiff {
    x: number;
    y: number;
}

export interface IDragActionArgs {
    positionDiff: IPositionDiff;
    nodes: Cy.NodeCollection;
}
export class DragAction extends Action<IDragActionArgs> {
    constructor() {
        super("drag");
    }
    public do(args: IDragActionArgs): void {
        moveNodes(args.positionDiff, args.nodes);
    }
    public undo(args: IDragActionArgs): void {
        const diff: IPositionDiff = {
            x: -1 * args.positionDiff.x,
            y: -1 * args.positionDiff.y,
        };
        moveNodes(diff, args.nodes);
    }

    public register(cy: Cy.Core) {
        const that = this;
        let lastMouseDownNodeInfo;
        cy.on("grab", "node", function(this: Cy.NodeCollection) {
            lastMouseDownNodeInfo = {};
            lastMouseDownNodeInfo.lastMouseDownPosition = {
                x: this.position("x"),
                y: this.position("y"),
            };
            lastMouseDownNodeInfo.node = this;
        });
        cy.on("free", "node", function(this: Cy.NodeCollection) {
            if (lastMouseDownNodeInfo == null) {
                return;
            }
            const node = lastMouseDownNodeInfo.node;
            const lastMouseDownPosition = lastMouseDownNodeInfo.lastMouseDownPosition;
            const mouseUpPosition = {
                x: node.position("x"),
                y: node.position("y"),
            };
            if (mouseUpPosition.x !== lastMouseDownPosition.x ||
                mouseUpPosition.y !== lastMouseDownPosition.y) {
                const positionDiff = {
                    x: mouseUpPosition.x - lastMouseDownPosition.x,
                    y: mouseUpPosition.y - lastMouseDownPosition.y,
                };

                let nodes: Cy.NodeCollection;
                if (node.selected()) {
                    nodes = cy.nodes(":visible").filter(":selected");
                } else {
                    nodes = cy.collection([node]);
                }

                const param: IDragActionArgs = {
                    positionDiff,
                    nodes,
                };
                that.push(param, true);

                lastMouseDownNodeInfo = null;
            }
        });
    }

}

const dragAction = new DragAction();

function getTopMostNodes(nodes: Cy.NodeCollection) {
    const nodesMap = {};
    for (let i = 0; i < nodes.length; i++) {
        nodesMap[nodes[i].id()] = true;
    }
    const roots = getNodes(nodes, (ele) => {
        let parent = ele.parent()[0];
        while (parent != null) {
            if (nodesMap[parent.id()]) {
                return false;
            }
            parent = parent.parent()[0];
        }
        return true;
    });

    return roots;
}

function moveNodes(positionDiff: IPositionDiff, nodes: Cy.NodeCollection, notCalcTopMostNodes: boolean = false) {
    const topMostNodes = notCalcTopMostNodes ? nodes : getTopMostNodes(nodes);
    for (let i = 0; i < topMostNodes.length; i++) {
        const node = topMostNodes[i];
        const {x: oldX, y: oldY} = node.position();
        node.position({
            x: oldX + positionDiff.x,
            y: oldY + positionDiff.y,
        });
        const children = node.children();
        moveNodes(positionDiff, children, true);
    }
}

export function registerGraph(cy: Cy.Core) {
    dragAction.register(cy);
}
