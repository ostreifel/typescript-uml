import { readFileSync } from "fs";
import * as ts from "typescript";
import * as vscode from "vscode";
import { getClassModel, IClassModel } from "./ClassModel";

function getAst(fileName: string): ts.SourceFile {
    return ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.Latest,
        /*setParentNodes */ true,
    );
}

function getClasses(node: ts.Node) {
    const classes: ts.ClassLikeDeclaration[] = [];
    node.forEachChild((n) => {
        if (n.kind === ts.SyntaxKind.ClassDeclaration) {
            classes.push(n as ts.ClassLikeDeclaration);
        }
    });
    return classes;
}

export function computeDiagram(document: vscode.TextDocument): IClassModel[] {
    const ast = getAst(document.fileName);
    const models = getClasses(ast).map((n) => getClassModel(n));
    return models;
}
