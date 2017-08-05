import { remote } from "electron";
import { readFileSync } from "fs";
import * as path from "path";

export function getCyStyle(): string {
    const extensionPath = remote.getGlobal("diagramArgs")[2];
    const cssPath = path.join(extensionPath, "html", "css", "cy.css");
    const style = readFileSync(cssPath, "utf-8");
    return style;
}
