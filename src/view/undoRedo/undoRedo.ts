const actions: { [key: string]: UndoRedoAction<any> } = {};

export interface IUndoRedoStacks {
    redo: IStoredAction[];
    undo: IStoredAction[];
}
export interface IStoredAction {
    name: string;
    args: IActionArgs;
}
let stacks: IUndoRedoStacks = {
    redo: [],
    undo: [],
};

/** Must be serializable -- no dom references, functions, or recursion */
export interface IActionArgs {}
export abstract class UndoRedoAction<T extends IActionArgs> {
    constructor(public readonly name) {
        actions[name] = this;
    }
    public push(args: T, silent: boolean = false) {
        stacks.redo = [];
        const action = actions[this.name];
        if (!action) {
            return;
        }
        if (!silent) {
            action.do(args);
        }
        stacks.undo.push({name: this.name, args});
        if (stacks.undo.length > 1000) {
            stacks.undo.splice(0, stacks.undo.length - 1000);
        }
    }
    public abstract do(args: T): void;
    public abstract undo(args: T): void;
    public abstract attach(cy: Cy.Core);
    public abstract detach();
}

export function redo() {
    const storedAction = stacks.redo.pop();
    if (!storedAction) {
        return;
    }
    const action = actions[storedAction.name];
    if (!action) {
        return;
    }
    action.do(storedAction.args);
    stacks.undo.push(storedAction);
}

export function undo() {
    const storedAction = stacks.undo.pop();
    if (!storedAction) {
        return;
    }
    const action = actions[storedAction.name];
    if (!action) {
        return;
    }
    action.undo(storedAction.args);
    stacks.redo.push(storedAction);
}

export function resetStacks(newStacks: IUndoRedoStacks) {
    stacks = newStacks;
}
