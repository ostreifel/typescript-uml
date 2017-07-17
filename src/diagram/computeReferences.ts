import * as ts from "typescript";
import { IDiagramElement } from "./DiagramModel";

function getSymbolTable(fileName: string) {
    const program = ts.createProgram([fileName], {});
    const sourceFile = program.getSourceFile(fileName);
    const typechecker = program.getTypeChecker();
    return {
        root: typechecker.getSymbolAtLocation(sourceFile),
        typechecker,
    };
}

function getValues<T>(m: ts.Map<T>): T[] {
    const values: T[] = [];
    m.forEach((v, k) => {
        values.push(v);
    });
    return values;
}

function childReferences(typechecker: ts.TypeChecker, symbol: ts.Symbol, idPrefix: string): IDiagramElement[] {
    const elements: IDiagramElement[] = [];
    if (symbol.exports) {
        getValues(symbol.exports).map((v) =>
            elements.push(...computeDiagram(typechecker, v, "")),
        );
    }
    if (symbol.members) {
        getValues(symbol.members).map((v) =>
            elements.push(...computeDiagram(typechecker, v, "")),
        );
    }
    return elements;
}

function getName(sym: ts.Symbol): string | null {
    if (!sym.declarations || !sym.declarations.length) {
        return null;
    }
    const named: ts.NamedDeclaration = sym.declarations[0];
    const ident: ts.Identifier = named.name as ts.Identifier;
    return ident && ident.text || null;
}

// function referencedNodes(typechecker: ts.TypeChecker, symbol: ts.Symbol, )

function inheritenceElement(typechecker: ts.TypeChecker, symbol: ts.Symbol, idPrefix: string, name: string) {
    const elements: IDiagramElement[] = [];
    elements.push({
        data: {
            id: `${idPrefix}.${name}`,
            name,
        },
    });
    if (symbol.exports) {
        getValues(symbol.exports).map((v) => {
            const vName = getName(v);
            if (!vName) {
                return;
            }
            elements.push(...[
                {
                    data: {
                        id: `${idPrefix}.${name}.${vName}`,
                        name: vName,
                    },
                },
                {
                    data: {
                        source: `${idPrefix}.${name}`,
                        target: `${idPrefix}.${name}.${vName}`,
                        weight: 1,
                    },
                },
            ]);
        });
    }
    if (symbol.members) {
        getValues(symbol.members).map((v) => {
            const vName = getName(v);
            if (!vName) {
                return;
            }
            elements.push(...[
                {
                    data: {
                        id: `${idPrefix}.${name}.${vName}`,
                        name: vName,
                    },
                },
                {
                    data: {
                        source: `${idPrefix}.${name}`,
                        target: `${idPrefix}.${name}.${vName}`,
                        weight: 1,
                    },
                },
            ]);

        });
    }
    return elements;
}

function computeDiagram(typechecker: ts.TypeChecker, symbol: ts.Symbol, idPrefix: string = ""): IDiagramElement[] {
    const elements: IDiagramElement[] = [];
    const symName = getName(symbol);
    if (symbol.flags & ts.SymbolFlags.ValueModule) {
        elements.push(...childReferences(typechecker, symbol, ""));
    } else if (
        symbol.flags & ts.SymbolFlags.ModuleMember
        && symName
    ) {
        elements.push(...inheritenceElement(typechecker, symbol, `${idPrefix}.${symName}`, symName));
    }
    return elements;
}

export function computeDiagramForFile(fileName: string): IDiagramElement[] {
    const { root, typechecker } = getSymbolTable(fileName);
    return computeDiagram(typechecker, root);
}
