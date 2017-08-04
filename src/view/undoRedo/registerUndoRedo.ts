
import { graphActions } from "./graphActions";
import { toggleNodeAction } from "./ToggleNode";
import { toggleTypeAction } from "./ToggleType";
import { IUndoRedoStacks, resetStacks } from "./undoRedo";

export function resetUndoRedo(cy: Cy.Core, newStacks: IUndoRedoStacks = { undo: [], redo: [] }) {
    resetStacks(newStacks);
    [
        ...graphActions,
        toggleNodeAction,
        toggleTypeAction,
    ].forEach((a) => a.attach(cy));
}
