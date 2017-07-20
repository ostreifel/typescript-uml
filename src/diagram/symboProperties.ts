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
        return "green";
    }
    return "pink";
}

function getShape(symbol: ts.Symbol): Cy.Css.NodeShape {
    if (
        symbol.flags & ts.SymbolFlags.Class ||
        symbol.flags & ts.SymbolFlags.Enum ||
        symbol.flags & ts.SymbolFlags.Interface
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

export function getSymbolProperties(symbol: ts.Symbol) {
    return {
        color: getColor(symbol),
        shape: getShape(symbol),
    };
}
