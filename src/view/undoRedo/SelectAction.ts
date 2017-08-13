import { getEles } from "../getEles";
import { IActionArgs, UndoRedoAction } from "./undoRedo";

export interface ISelectAction extends IActionArgs {
    startSelect: string;
    endSelect: string;
}
export class SelectAction extends UndoRedoAction<ISelectAction> {
    private cy?: Cy.Core;
    constructor(
        private readonly onSelect: (ele: Cy.CollectionElements) => void,
        private readonly onUnselect: (ele: Cy.CollectionElements) => void,
    ) {
        super("select");
    }
    public do({ startSelect, endSelect }: ISelectAction): void {
        this.unselect(startSelect);
        this.select(endSelect);
    }
    public undo({ startSelect, endSelect }: ISelectAction): void {
        this.unselect(endSelect);
        this.select(startSelect);
    }
    public attach(cy: Cy.Core) {
        this.detach();
        this.cy = cy;
    }
    public detach() {
        this.cy = undefined;
    }
    private select(id: string): void {
        if (!id || !this.cy) {
            return;
        }
        const ele = getEles(
            this.cy.elements(),
            (e) => e.id() === id,
        );
        if (ele.isNode()) {
            this.addNodeEdgeHighlights(ele as Cy.NodeCollection);
        }
        this.panIfNecessary(ele);
        ele.selectify();
        ele.select();
        ele.unselectify();
        this.fadeUnrelated(ele);
        this.onSelect(ele);
    }
    private panIfNecessary(ele: Cy.NodeCollection) {
        if (this.cy && ele.isNode()) {
            const cyExtent = this.cy.extent();
            const box = ele.boundingBox({}) as Cy.BoundingBox12 & Cy.BoundingBoxWH;
            let deltaX = 0;
            let deltaY = 0;
            if (box.x1 < cyExtent.x1 && box.x2 < cyExtent.x1) {
                deltaX = cyExtent.x1 - box.x1;
            } else if (box.x2 > cyExtent.x2 && box.x1 > cyExtent.x2) {
                deltaX = cyExtent.x2 - box.x2;
            }
            if (box.y1 < cyExtent.y1 && box.y2 < cyExtent.y1) {
                deltaY = cyExtent.y1 - box.y1;
            } else if (box.y2 > cyExtent.y2 && box.y1 > cyExtent.y2) {
                deltaY = cyExtent.y2 - box.y2;
            }
            const boundingRect = (this.cy.container() as Element).getBoundingClientRect();

            // Convert from position units to pixel units
            deltaX *= boundingRect.width / cyExtent.w;
            deltaY *= boundingRect.height / cyExtent.h;
            this.cy.panBy({x: deltaX, y: deltaY});
        }
    }
    private addNodeEdgeHighlights(node: Cy.NodeCollection) {
        node.incomers().edges("").addClass("incoming");
        node.outgoers().edges("").addClass("outgoing");
    }
    private fadeUnrelated(ele: Cy.CollectionElements) {
        if (!this.cy) {
            return;
        }
        const ids: string[] = [];
        if (ele.isNode()) {
            const node = ele as Cy.NodeCollection;
            node.incomers().map((e) => ids.push(...[e.id(), ...this.getParents(e)]));
            node.outgoers().map((e) => ids.push(...[e.id(), ...this.getParents(e)]));
            ids.push(...[ele.id(), ...this.getParents(ele)]);
        } else if (ele.isEdge()) {
            const edge = ele as Cy.EdgeCollection;
            ids.push(edge.id());
            const source = edge.source();
            const target = edge.target();
            ids.push(...[source.id(), ...this.getParents(source)]);
            ids.push(...[target.id(), ...this.getParents(target)]);
        }
        const idSet: {[id: string]: undefined} = {};
        for (const id of ids) {
            idSet[id] = undefined;
        }
        getEles(this.cy.elements(), (e) => !(e.id() in idSet)).addClass("faded");
    }
    private getParents(node?: Cy.NodeCollection): string[] {
        if (!node || !node.parent() || !node.isNode()) {
            return [];
        }
        return [node.parent().id(), ...this.getParents(node.parent())];
    }
    private unselect(id: string): void {
        if (!id || !this.cy) {
            return;
        }
        const ele = getEles(
            this.cy.elements(),
            (e) => e.id() === id,
        );
        if (ele.isNode()) {
            this.removeNodeEdgeHighlights(ele as Cy.NodeCollection);
        }
        ele.selectify();
        ele.unselect();
        ele.unselectify();
        this.onUnselect(ele);
        this.cy.elements().removeClass("faded");
    }
    private removeNodeEdgeHighlights(node: Cy.NodeCollection) {
        node.incomers().edges("").removeClass("incoming");
        node.outgoers().edges("").removeClass("outgoing");
    }
}
