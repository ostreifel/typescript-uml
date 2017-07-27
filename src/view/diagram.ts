
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
    const runLayout = () => applyLayout(cy.nodes(), boxGridLayout(cy.nodes()));
    runLayout();
    $("#cy").dblclick(runLayout);
    registerInfoPane(cy.on.bind(cy));
    registerFilterPane(cy);
}
setTimeout(run, 0);
