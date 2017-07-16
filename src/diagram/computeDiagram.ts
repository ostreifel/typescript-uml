import { readFileSync } from "fs";
import * as ts from "typescript";
import * as vscode from "vscode";
import { getClassModel, IClassModel } from "./ClassModel";
import { IDiagramModel } from "./DiagramModel";

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

function classesToDiagram(models: IClassModel[]): IDiagramModel {
    const diagram: IDiagramModel = [];
    for (const model of models) {
        diagram.push({
            data: {
                id: model.name,
                name: model.name,
            },
        });
        for (const member in model.memberGraph) {
            diagram.push({
                data: {
                    id: `${model.name}.${member}`,
                    name: member,
                },
            });
            diagram.push({ data: { source: model.name, target: `${model.name}.${member}` } });
            const links = model.memberGraph[member];
            for (const link in links) {
                diagram.push({ data: { source: `${model.name}.${member}`, target: `${model.name}.${link}` } });
            }
        }
    }
    return diagram;
}

export function computeDiagram(document: vscode.TextDocument): IDiagramModel {
    const ast = getAst(document.fileName);
    const models = getClasses(ast).map((n) => getClassModel(n));
    return classesToDiagram(models);
}
