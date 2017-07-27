
import { remote } from "electron";
import * as fs from "fs";
import * as path from "path";
import { computeDiagramForFile } from "../diagram/computeDiagram";
import { registerInfoPane } from "./ElementInfo";
import { registerFilterPane } from "./GraphFilter";
import { applyLayout, boxGridLayout, getPositions } from "./Layouts";
import { getCyStyle } from "./style";

function saveGraph(elements: Cy.ElementDefinition[], cy: Cy.Core) {
    const [, , , filePath] = remote.getGlobal("diagramArgs");
    const saveData = {
        version: 1,
        elements,
        filePath,
        positions: getPositions(cy.nodes()),
    };
    const defaultPath = path.basename(filePath).match(/^(.*?)(.tsx?)?$/)[1] + ".tsgraph.json";
    remote.dialog.showSaveDialog({
        filters: [{
            name: "Typescript Graphs",
            extensions: ["tsgraph.json"],
        }],
        defaultPath,
    }, (fileName) => {
        fs.writeFile(fileName, JSON.stringify(saveData), (err) => {
            // tslint:disable-next-line:no-console
            console.log("error", err);
        });
    });
}
function setMenuItems(elements: Cy.ElementDefinition[], cy: Cy.Core) {
    const menu = remote.Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                {
                    label: "Save",
                    accelerator: "CommandOrControl+S",
                    click: () => saveGraph(elements, cy),
                },
                {
                    label: "Open",
                    accelerator: "CommandOrControl+O",
                    // tslint:disable-next-line:no-console
                    click: () => console.log("TODO open here"),
                },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "togglefullscreen" },
                { role: "reload" },
                { role: "toggledevtools" },
            ],
        },
    ]);
    remote.getCurrentWindow().setMenu(menu);
}
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
    setMenuItems(elements, cy);
}
setTimeout(run, 0);
