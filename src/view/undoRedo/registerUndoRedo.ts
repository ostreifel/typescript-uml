
import { registerGraphActions } from "./graphActions";
import { IUndoRedoStacks, resetStacks, UndoRedoAction } from "./undoRedo";

let registeredActions: Array<UndoRedoAction<any>> = [];
export function resetUndoRedo(cy: Cy.Core, newStacks: IUndoRedoStacks = { undo: [], redo: [] }) {
    resetStacks(newStacks);
    registeredActions.forEach((a) => a.detach());
    registeredActions = registerGraphActions(cy);
}
