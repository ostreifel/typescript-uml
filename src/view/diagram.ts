
import { remote } from "electron";
import { computeDiagramForFile } from "../diagram/computeDiagram";
import { showElementInfo } from "./ElementInfo";
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
    cy.on("select unselect", "node", showElementInfo);
    const boxLayout = new BoxGridLayout(cy.nodes());
    applyLayout(cy.nodes(), boxLayout.getLayout());
    $(".more-options").click(() => $(".filter-options").toggle());
    new GraphFilter(cy).register();
}
// $("#cy").click(run);
setTimeout(run, 0);
