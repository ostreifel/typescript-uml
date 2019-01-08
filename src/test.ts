import * as import_alias from "assert";

// force use so compiler doesn't remove import from example file
// tslint:disable-next-line:no-console
console.log(import_alias);


export type type1 = number;

export enum Enum1 {
    enumMember1,
}

export const constant_variable = "const";
export var variable = "variable";
export class Class {
    public classProperty;
    public constructor() {
    }
    public method() {
    }
}

export namespace module1 {
    export function function1() {
    }
}