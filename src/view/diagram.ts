
import { remote } from "electron";
import * as fs from "fs";
import * as path from "path";
import { computeDiagramForFile } from "../diagram/computeDiagram";
import { registerInfoPane } from "./ElementInfo";
import { registerFilterPane } from "./GraphFilter";
import {
    applyLayout,
    boxGridLayout,
    getPositions,
    INodePositions,
    presetLayout,
} from "./Layouts";
import { getCyStyle } from "./style";

const fileExtension = "tsgraph.json";
const fileFilters: Electron.FileFilter[] = [{
    name: "Typescript Graphs",
    extensions: [fileExtension],
}];

interface ISaveData {
    fileFormatVersion: number;
    elements: Cy.ElementDefinition[];
    filePath: string;
    positions: INodePositions;
}
function saveGraph(filePath: string, elements: Cy.ElementDefinition[], cy: Cy.Core) {
    const saveData: ISaveData = {
        fileFormatVersion: 1,
        elements,
        filePath,
        positions: getPositions(cy.nodes()),
    };
    const baseFileName = path.basename(filePath).match(/^(.*?)(.tsx?)?$/)[1];
    const defaultPath =  `${baseFileName}.${fileExtension}`;
    remote.dialog.showSaveDialog({
        filters: fileFilters,
        defaultPath,
    }, (fileName) => {
        fs.writeFile(fileName, JSON.stringify(saveData), (err) => {
            // tslint:disable-next-line:no-console
            console.log("error", err);
        });
    });
}
function loadGraph() {
    remote.dialog.showOpenDialog({
        filters: fileFilters,
    }, ([filePath]) => {
        if (!filePath) {
            return;
        }
        fs.readFile(filePath, (err, buffer: Buffer) => {
            const dataStr = buffer.toString("utf-8");
            const data = JSON.parse(dataStr);
            updateUI(data.filePath, data.elements, () => presetLayout(data.positions));
        });
    });
}
function setMenuItems(filePath: string, elements: Cy.ElementDefinition[], cy: Cy.Core) {
    const menu = remote.Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                {
                    label: "Save",
                    accelerator: "CommandOrControl+S",
                    click: () => saveGraph(filePath, elements, cy),
                },
                {
                    label: "Open",
                    accelerator: "CommandOrControl+O",
                    // tslint:disable-next-line:no-console
                    click: () => loadGraph(),
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
function getModels(filePath: string) {
    return computeDiagramForFile(filePath);
}
function updateWindowTitle(filePath: string) {
    remote.getCurrentWindow().setTitle(`${path.basename(filePath)} UML`);
}
function updateUI(
    filePath: string,
    elements: Cy.ElementDefinition[],
    layout: (cy: Cy.NodeCollection) => Cy.LayoutOptions,
) {
    const cy = cytoscape({
        container: $("#cy"),
        elements,
        boxSelectionEnabled: false,
        selectionType: "single",
        style: getCyStyle(),
        layout: { name: "null" } as Cy.NullLayoutOptions,
    });
    setMenuItems(filePath, elements, cy);
    updateWindowTitle(filePath);
    const runLayout = () => applyLayout(cy.nodes(), layout(cy.nodes()));
    runLayout();
    $("#cy").dblclick(runLayout);
    registerInfoPane(cy.on.bind(cy));
    registerFilterPane(cy);
}
function loadInitial() {
    const [, , , filePath] = remote.getGlobal("diagramArgs");
    const elements: Cy.ElementDefinition[] = getModels(filePath);
    updateUI(filePath, elements, (eles) => boxGridLayout(eles));
}
loadInitial();
