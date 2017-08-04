import { getNodes } from "../getEles";
import { UndoRedoAction } from "./undoRedo";

export interface IFilterActionArgs {
    type: string;
}
class ToggleTypeAction extends UndoRedoAction<IFilterActionArgs> {
    private cy: Cy.Core;
    constructor() {
        super("toggle-type");
    }
    public do({ type }: IFilterActionArgs): void {
        this.toggle(type);
    }
    public undo({ type }: IFilterActionArgs): void {
        this.toggle(type);
    }
    public attach(cy: Cy.Core) {
        this.detach();
        this.cy = cy;
    }
    public detach() {
        this.cy = null;
    }
    private toggle(type: string) {
        getNodes(this.cy.nodes(), (n) => n.data("type") === type).toggleClass("hidden-type");
    }
}
export const toggleTypeAction = new ToggleTypeAction();
