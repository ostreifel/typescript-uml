
import { registerGraphActions } from "./graphActions";
import { IUndoRedoStacks, resetStacks } from "./undoRedo";

export function resetUndoRedo(cy: Cy.Core, newStacks: IUndoRedoStacks = { undo: [], redo: [] }) {
    resetStacks(newStacks);
    registerGraphActions(cy);
}
