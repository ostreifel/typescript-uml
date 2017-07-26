
import { remote } from "electron";
import { computeDiagramForFile } from "../diagram/computeDiagram";
import { updateElementInfoBar } from "./ElementInfo";
import { GraphFilter } from "./GraphFilter";
import { applyLayout, BoxGridLayout } from "./Layouts";
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
    cy.on("select unselect", "node", updateElementInfoBar);
    const boxLayout = new BoxGridLayout(cy, cy.nodes());
    applyLayout(cy.nodes(), boxLayout.getLayout());
    $(".more-options").click(() => $(".filter-options").toggle());
    new GraphFilter(cy).register();
}
// $("#cy").click(run);
setTimeout(run, 0);
