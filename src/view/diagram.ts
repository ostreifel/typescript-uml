
import { remote } from "electron";
import { computeDiagramForFile } from "../diagram/computeDiagram";
import { registerInfoPane } from "./ElementInfo";
import { registerFilterPane } from "./GraphFilter";
import { applyLayout, boxGridLayout } from "./Layouts";
import { getCyStyle } from "./style";

function getModels() {
    const [, , , filePath] = remote.getGlobal("diagramArgs");
    return computeDiagramForFile(filePath);
}
function run() {
    const elements: Cy.ElementDefinition[] = getModels();
    const cy = cytoscape({
        container: $("#cy"),
        elements,
        boxSelectionEnabled: false,
        selectionType: "single",
        style: getCyStyle(),
        layout: {name: "null"} as Cy.NullLayoutOptions,
    });
    applyLayout(cy.nodes(), boxGridLayout(cy.nodes()));
    registerInfoPane(cy.on.bind(cy));
    registerFilterPane(cy);
}
$("#cy").dblclick(run);
setTimeout(run, 0);
