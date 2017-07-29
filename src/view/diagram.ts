
import { remote } from "electron";
import * as fs from "fs";
import * as path from "path";
import { computeDiagramForFile } from "../diagram/computeDiagram";
import { getInfoPaneState, registerInfoPane } from "./ElementInfo";
import { getCurrentFilterState, IInitialGraphFilterState, registerFilterPane } from "./GraphFilter";
import {
    applyLayout,
    boxGridLayout,
} from "./Layouts";
import { getCyStyle } from "./style";

const fileExtension = "tsgraph.json";
const fileFilters: Electron.FileFilter[] = [{
    name: "Typescript Graphs",
    extensions: [fileExtension],
}];

interface ISaveData {
    fileFormatVersion: number;
    cyData: Cy.CytoscapeOptions;
    filePath: string;
    infoPanelState: string;
    filterPanelState: IInitialGraphFilterState;
}
function saveGraph(filePath: string, cy: Cy.Core) {
    const saveData: ISaveData = {
        fileFormatVersion: 1,
        cyData: cy.json() as Cy.CytoscapeOptions,
        infoPanelState: getInfoPaneState(),
        filterPanelState: getCurrentFilterState(),
        filePath,
    };
    const baseFileName = path.basename(filePath).match(/^(.*?)(.tsx?)?$/)[1];
    const defaultPath = `${baseFileName}.${fileExtension}`;
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
            // tslint:disable-next-line:no-console
            console.log(err);
            const dataStr = buffer.toString("utf-8");
            const data: ISaveData = JSON.parse(dataStr);
            updateUI(data);
        });
    });
}
function setMenuItems(filePath: string, cy: Cy.Core) {
    const menu = remote.Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                {
                    label: "Save",
                    accelerator: "CommandOrControl+S",
                    click: () => saveGraph(filePath, cy),
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
                {
                    label: "Reset Layout",
                    accelerator: "Alt+E",
                    click: () => applyDefaultLayout(cy),
                },
            ],
        },
    ]);
    remote.getCurrentWindow().setMenu(menu);
}
function updateWindowTitle(status: string) {
    remote.getCurrentWindow().setTitle(status);
}

function applyDefaultLayout(cy: Cy.Core) {
    const currentTitle = remote.getCurrentWindow().getTitle();
    updateWindowTitle("Computing layout...");
    applyLayout(cy.nodes(), boxGridLayout(cy.nodes()));
    updateWindowTitle(currentTitle);
}
function updateUI(
    {
        filePath,
        filterPanelState,
        infoPanelState,
        cyData,
    }: ISaveData,
): Cy.Core {
    updateWindowTitle("Drawing graph...");
    // tslint:disable-next-line:no-console
    console.log("cyData", cyData);
    const cy = cytoscape({ container: $("cy")[0], ...cyData });
    setMenuItems(filePath, cy);
    registerInfoPane(cy, infoPanelState);
    registerFilterPane(cy, filterPanelState);
    updateWindowTitle(`${path.basename(filePath)} UML`);
    return cy;
}
function loadInitial() {
    const [, , , filePath] = remote.getGlobal("diagramArgs");
    const elements: Cy.ElementDefinition[] = computeDiagramForFile(filePath, updateWindowTitle);
    const cyData: Cy.CytoscapeOptions = {
        elements,
        boxSelectionEnabled: false,
        selectionType: "additive",
        style: getCyStyle(),
        layout: { name: "null" } as Cy.NullLayoutOptions,
    };
    const cy = updateUI({
        cyData,
        fileFormatVersion: 1,
        filePath,
        filterPanelState: { showFilter: false, types: {} },
        infoPanelState: "",
    });
    applyDefaultLayout(cy);
}

remote.getCurrentWindow().setMenu(remote.Menu.buildFromTemplate([
    { role: "toggledevtools" },
]));
loadInitial();
