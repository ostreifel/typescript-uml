import { getNodes } from "../getEles";
import { UndoRedoAction } from "./undoRedo";

export interface IToggleNodeArgs {
    id: string;
}
export type IHiddenNodes = string[];
export class ToggleNode extends UndoRedoAction<IToggleNodeArgs> {
    private cy?: Cy.Core;
    constructor() {
        super("toggleNode");
    }

    public do({id}: IToggleNodeArgs): void {
        this.toggle(id);
    }
    public undo({id}: IToggleNodeArgs): void {
        this.toggle(id);
    }
    public attach(cy: Cy.Core) {
        this.cy = cy;
    }
    public detach() {
        this.cy = undefined;
    }
    public getHiddenNodes(): IHiddenNodes {
        if (!this.cy) {
            return [];
        }
        return this.cy.nodes(".hidden").map((n) => n.id());
    }
    public restoreHiddenNodes(nodes: IHiddenNodes) {
        if (!this.cy) {
            return;
        }
        const idSet: {[id: string]: void} = {};
        for (const node of nodes) {
            idSet[node] = undefined;
        }
        getNodes(this.cy.nodes(), (n) => n.id() in idSet).addClass("hidden");
    }
    private toggle(id: string) {
        if (!this.cy) {
            return;
        }
        getNodes(this.cy.nodes(), (n) => n.id() === id).toggleClass("hidden");
    }
}
export const toggleNodeAction = new ToggleNode();
