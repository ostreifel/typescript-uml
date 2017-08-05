import * as ts from "typescript";
import { IDiagramFilePosition } from "./DiagramModel";

function getColor(symbol: ts.Symbol): Cy.Css.Colour {
    if (symbol.flags & ts.SymbolFlags.Class) {
        return "darkblue";
    } else if (symbol.flags & ts.SymbolFlags.Interface) {
        return "blue";
    } else if (symbol.flags & ts.SymbolFlags.ClassMember) {
        return "lightblue";
    } else if (symbol.flags & ts.SymbolFlags.TypeParameter) {
        return "#2a7189"; // dark light blue
    } else if (symbol.flags & ts.SymbolFlags.Constructor) {
        return "#2b6378"; // darker light blue
    } else if (symbol.flags & ts.SymbolFlags.Function) {
        return "purple";
    } else if (symbol.flags & ts.SymbolFlags.Variable) {
        return "orange";
    } else if (symbol.flags & ts.SymbolFlags.Enum) {
        return "darkgray";
    } else if (symbol.flags & ts.SymbolFlags.EnumMember) {
        return "gray";
    } else if (symbol.flags & ts.SymbolFlags.Alias) {
        return "red";
    } else if (symbol.flags & ts.SymbolFlags.Module) {
        return "green";
    }
    return "pink";
}

function getShape(symbol: ts.Symbol): Cy.Css.NodeShape {
    if (
        symbol.flags & ts.SymbolFlags.Class ||
        symbol.flags & ts.SymbolFlags.Enum ||
        symbol.flags & ts.SymbolFlags.Interface ||
        symbol.flags & ts.SymbolFlags.Module
    ) {
        return "rectangle";
    } else if (
        symbol.flags & ts.SymbolFlags.Variable ||
        symbol.flags & ts.SymbolFlags.Alias ||
        symbol.flags & ts.SymbolFlags.Property ||
        symbol.flags & ts.SymbolFlags.TypeParameter ||
        symbol.flags & ts.SymbolFlags.EnumMember
    ) {
        return "diamond";
    }
    return "ellipse";
}

function getType(symbol: ts.Symbol): string {
    if (symbol.flags & ts.SymbolFlags.Class) {
        return "class";
    } else if (symbol.flags & ts.SymbolFlags.Interface) {
        return "interface";
    } else if (symbol.flags & ts.SymbolFlags.Property) {
        return "property";
    } else if (symbol.flags & ts.SymbolFlags.Method) {
        return "method";
    } else if (symbol.flags & ts.SymbolFlags.TypeParameter) {
        return "type parameter";
    } else if (symbol.flags & ts.SymbolFlags.Constructor) {
        return "constructor";
    } else if (symbol.flags & ts.SymbolFlags.Function) {
        return "function";
    } else if (symbol.flags & ts.SymbolFlags.Variable) {
        return "variable";
    } else if (symbol.flags & ts.SymbolFlags.Enum) {
        return "enum";
    } else if (symbol.flags & ts.SymbolFlags.EnumMember) {
        return "enum member";
    } else if (symbol.flags & ts.SymbolFlags.Alias) {
        return "alias";
    } else if (symbol.flags & ts.SymbolFlags.Module) {
        return "module";
    } else if (symbol.flags & ts.SymbolFlags.TypeAlias) {
        return "type alias";
    }
    return "";
}
export function getPositionProperties(symbol: ts.Symbol) {
    let nodeSize = 30;
    if (!symbol.declarations) {
        throw new Error("Can only get properties of symbols with declarations");
    }
    const declaration = symbol.declarations[0];
    const sourceFile = declaration.getSourceFile();
    const startLineChar = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());
    const endLine = sourceFile.getLineAndCharacterOfPosition(declaration.getEnd()).line + 1;
    const filePosition: IDiagramFilePosition = {
        fileName: sourceFile.fileName,
        line: startLineChar.line + 1,
        column: startLineChar.character + 1,
    };

    const lineCount = endLine - startLineChar.line;
    if (lineCount > 2) {
        nodeSize = 30 + Math.ceil(Math.pow(lineCount, 0.60) * 5);
    }
    return {
        filePosition,
        lineCount,
        nodeSize,
    };
}

export function getSymbolProperties(symbol: ts.Symbol) {
    return {
        color: getColor(symbol),
        shape: getShape(symbol),
        type: getType(symbol),
        ...getPositionProperties(symbol),
    };
}
