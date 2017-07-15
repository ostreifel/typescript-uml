import * as ts from "typescript";

export interface IClassModel {
    name: string;
    memberLookup: { [member: string]: ts.NamedDeclaration };
    memberGraph: { [member: string]: { [member: string]: number } };
}

function getMemberName(node: ts.NamedDeclaration) {
    if (node.name) {
        return node.name.getText();
    }
    throw Error("remember to filter out unnamed nodes");
}

function walkChildren(node: ts.Node, visitor: (n: ts.Node) => void) {
    node.forEachChild((child) => {
        visitor(child);
        walkChildren(child, visitor);
    });
}

function computeMemberGraph(model: IClassModel, member: ts.NamedDeclaration): void {
    const graph: { [member: string]: number } = {};
    model.memberGraph[getMemberName(member)] = graph;
    const self = getMemberName(member);
    walkChildren(member, (n) => {
        if (n.kind === ts.SyntaxKind.Identifier) {
            const id = (n as ts.Identifier).text;
            if (id in model.memberLookup && id !== self) {
                graph[id] = graph[id] + 1 || 1;
            }
        }
    });
}

export function getClassModel(clazz: ts.ClassLikeDeclaration): IClassModel {
    const model: IClassModel = {
        memberGraph: {},
        memberLookup: {},
        name: clazz.name.text,
    };
    for (const member of clazz.members) {
        if (member.name && member.name.getText()) {
            model.memberLookup[member.name.getText()] = member;
        }
    }
    for (const member in model.memberLookup) {
        computeMemberGraph(model, model.memberLookup[member]);
    }
    return model;
}
