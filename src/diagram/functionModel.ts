import * as ts from "typescript";

export interface IFunctionModel {
    name: string;
    memberLookup: { [member: string]: ts.NamedDeclaration };
    memberGraph: { [member: string]: { [member: string]: number } };
}

// export function getClassModel(clazz: ts.FunctionDeclaration): IFunctionModel {

// }
