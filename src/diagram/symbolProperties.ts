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
function occurrences(str: string, subString: string, allowOverlapping?: boolean): number {
    str += "";
    subString += "";
    if (subString.length <= 0) {
        return (str.length + 1);
    }

    let n = 0;
    let pos = 0;
    const step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = str.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else {
            break;
        }
    }
    return n;
}
export function getLine(symbol: ts.Symbol): number | null {
    if (!symbol.declarations || !symbol.declarations.length) {
        return null;
    }
    const declaration = symbol.declarations[0];
    const sourceFile = declaration.getSourceFile();
    return sourceFile.getLineAndCharacterOfPosition(declaration.getStart()).line + 1;
}

export function getSymbolProperties(symbol: ts.Symbol) {
    return {
        color: getColor(symbol),
        shape: getShape(symbol),
        valign: getValign(symbol),
        type: getType(symbol),
        line: getLine(symbol),
    };
}
