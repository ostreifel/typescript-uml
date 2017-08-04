
import { getNodes } from "../getEles";
import { getPositions, INodePositions, presetLayout } from "../Layouts";
import { UndoRedoAction } from "./undoRedo";

export interface IPositionDiff {
    x: number;
    y: number;
}

export interface IDragActionArgs {
    positionDiff: IPositionDiff;
    nodes: Cy.NodeCollection;
}
export class DragAction extends UndoRedoAction<IDragActionArgs> {
    private cy?: Cy.Core;
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

    public attach(cy: Cy.Core) {
        this.detach();
        this.cy = cy;
        const that = this;
        let lastMouseDownNodeInfo;
        this.cy.on("grab", "node", function(this: Cy.NodeCollection) {
            lastMouseDownNodeInfo = {};
            lastMouseDownNodeInfo.lastMouseDownPosition = {
                x: this.position("x"),
                y: this.position("y"),
            };
            lastMouseDownNodeInfo.node = this;
        });
        this.cy.on("free", "node", function(this: Cy.NodeCollection) {
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
                if (that.cy) {
                    if (node.selected()) {
                        nodes = that.cy.nodes(":visible").filter(":selected");
                    } else {
                        nodes = that.cy.collection([node]);
                    }

                    const param: IDragActionArgs = {
                        positionDiff,
                        nodes,
                    };
                    that.push(param, true);
                }

                lastMouseDownNodeInfo = null;
            }
        });
    }
    public detach() {
        if (!this.cy) {
            return;
        }
        this.cy.off("free", "node");
        this.cy.off("grab", "node");
        this.cy = undefined;
    }
}

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

export interface ILayoutAction {
    startPositions: INodePositions;
    endPositions: INodePositions;
}
export class LayoutAction extends UndoRedoAction<ILayoutAction> {
    private actionInProgress = false;
    private cy?: Cy.Core;
    constructor() {
        super("layout");
    }
    public do(args: ILayoutAction): void {
        if (!this.cy) {
            return;
        }
        this.actionInProgress = true;
        const presetOptions = presetLayout(args.endPositions);
        // tslint:disable-next-line:no-any
        const layout: Cy.Layouts = this.cy.layout(presetOptions) as any;
        layout.run();
        this.actionInProgress = false;
    }
    public undo(args: ILayoutAction): void {
        if (!this.cy) {
            return;
        }
        this.actionInProgress = true;
        const presetOptions = presetLayout(args.startPositions);
        // tslint:disable-next-line:no-any
        const layout: Cy.Layouts = this.cy.layout(presetOptions) as any;
        layout.run();
        this.actionInProgress = false;
    }

    public attach(cy: Cy.Core) {
        this.detach();
        this.cy = cy;
        let startPositions: INodePositions;
        this.cy.on("layoutstart", (args) => {
            if (this.actionInProgress) {
                return;
            }
            const eles: Cy.NodeCollection = args.layout.options.eles;
            startPositions = getPositions(eles);
        });
        this.cy.on("layoutready", (args) => {
            if (this.actionInProgress) {
                return;
            }
            const eles: Cy.NodeCollection = args.layout.options.eles;
            const endPositions = getPositions(eles);
            this.push({startPositions, endPositions}, true);
        });
    }
    public detach() {
        if (!this.cy) {
            return;
        }
        this.cy.off("layoutstart");
        this.cy.off("layoutready");
        this.cy = undefined;
    }
}

export const graphActions = [new DragAction(), new LayoutAction()];
