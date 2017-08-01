
const actions: { [key: string]: Action<any> } = {};

export interface IStoredAction {
    name: string;
    args: IActionArgs;
}
const redoStack: IStoredAction[] = [];
const undoStack: IStoredAction[] = [];

export interface IActionArgs {}
export abstract class Action<T extends IActionArgs> {
    constructor(public readonly name) {
        actions[name] = this;
    }
    public push(args: T, silent: boolean = false) {
        redoStack.length = 0;
        const action = actions[this.name];
        if (!action) {
            return;
        }
        if (!silent) {
            action.do(args);
        }
        undoStack.push({name: this.name, args});
        if (undoStack.length > 1000) {
            undoStack.splice(0, undoStack.length - 1000);
        }
    }
    public abstract do(args: T): void;
    public abstract undo(args: T): void;
}
export function redo() {
    const storedAction = redoStack.pop();
    if (!storedAction) {
        return;
    }
    const action = actions[storedAction.name];
    if (!action) {
        return;
    }
    action.do(storedAction.args);
    undoStack.push(storedAction);
}

export function undo() {
    const storedAction = undoStack.pop();
    if (!storedAction) {
        return;
    }
    const action = actions[storedAction.name];
    if (!action) {
        return;
    }
    action.undo(storedAction.args);
    redoStack.push(storedAction);
}
