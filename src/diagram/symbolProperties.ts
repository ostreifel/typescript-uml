import * as ts from "typescript";

function getColor(symbol: ts.Symbol): Cy.Css.Colour {
    if (symbol.flags & ts.SymbolFlags.Class) {
        return "darkblue";
    } else if (symbol.flags & ts.SymbolFlags.Interface) {
        return "blue";
    } else if (symbol.flags & ts.SymbolFlags.ClassMember) {
        return "lightblue";
    } else if (symbol.flags & ts.SymbolFlags.TypeParameter) {
        return "#2a7189"; // darker light blue
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

function getValign(symbol: ts.Symbol): "top" | "center" | "bottom" {
    if (
        symbol.flags & ts.SymbolFlags.Class ||
        symbol.flags & ts.SymbolFlags.Enum ||
        symbol.flags & ts.SymbolFlags.Interface ||
        symbol.flags & ts.SymbolFlags.Module
    ) {
        return "top";
    }
    return "center";
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
    }
    return "";
}
export function getPositionProperties(symbol: ts.Symbol) {
    let nodeSize = 30;
    if (!symbol.declarations || !symbol.declarations.length) {
        return {nodeSize};
    }
    const declaration = symbol.declarations[0];
    const sourceFile = declaration.getSourceFile();
    const startLine = sourceFile.getLineAndCharacterOfPosition(declaration.getStart()).line + 1;
    const endLine = sourceFile.getLineAndCharacterOfPosition(declaration.getEnd()).line + 1;

    const lineCount = endLine - startLine;
    if (lineCount > 0) {
        nodeSize = 25 + Math.ceil(Math.log2(lineCount)) * 5;
    }
    return {
        startLine,
        lineCount,
        nodeSize,
    };
}

export function getSymbolProperties(symbol: ts.Symbol) {
    return {
        color: getColor(symbol),
        shape: getShape(symbol),
        valign: getValign(symbol),
        type: getType(symbol),
        ...getPositionProperties(symbol),
    };
}
