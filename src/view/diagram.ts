import { remote } from "electron";
import * as fs from "fs";
import * as path from "path";
import { computeDiagramForFile } from "../diagram/computeDiagram";
import { getInfoPaneState, registerInfoPane } from "./elementInfo";
import { hovers } from "./hover";
import {
    applyLayout,
    boxGridLayout,
    BoxGridLayout,
    getPositions,
    INodePositions,
    presetLayout,
} from "./Layouts";
import { panControls } from "./panControls";
import { registerSearchBox } from "./searchControl";
import { getCyStyle } from "./style";
import { resetUndoRedo } from "./undoRedo/registerUndoRedo";
import { IHiddenNodes, toggleNodeAction } from "./undoRedo/ToggleNode";
import { getUndoRedoStacks, IUndoRedoStacks, redo, undo } from "./undoRedo/undoRedo";
import { zoomControls } from "./zoomControls";

const fileExtension = "tsgraph.json";
const fileFilters: Electron.FileFilter[] = [{
    name: "Typescript Graphs",
    extensions: [fileExtension],
}];

interface ISaveData {
    fileFormatVersion: number;
    elements: Cy.ElementDefinition[];
    positions: INodePositions;
    filePath: string;
    infoPanelState: string;
    hiddenNodes: IHiddenNodes;
    undoRedoStacks: IUndoRedoStacks;
}

function getElements(cy: Cy.Core): Cy.ElementDefinition[] {
    const elements = (cy.json() as Cy.CytoscapeOptions).elements as Cy.ElementsDefinition;
    return [...elements.nodes, ...elements.edges].map((e) => ({ data: e.data, classes: e.classes }));
}
function getBaseFileName(filePath: string): string {
    const baseNameMatch = path.basename(filePath).match(/^(.*?)(.tsx?)?$/);
    if (!baseNameMatch) {
        throw new Error(`Could not find the base name for ${filePath}`);
    }
    return baseNameMatch[1];
}

function saveGraph(filePath: string, cy: Cy.Core) {
    const saveData: ISaveData = {
        fileFormatVersion: 1,
        elements: getElements(cy),
        positions: getPositions(cy.nodes()),
        infoPanelState: getInfoPaneState(),
        hiddenNodes: toggleNodeAction.getHiddenNodes(),
        undoRedoStacks: getUndoRedoStacks(),
        filePath,
    };
    const baseFileName = getBaseFileName(filePath);
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
            const layout = presetLayout(data.positions);
            const cy = updateUI(data, layout);
            toggleNodeAction.restoreHiddenNodes(data.hiddenNodes);
            resetUndoRedo(cy, data.undoRedoStacks);
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
                {
                    label: "Re-Compile",
                    accelerator: "Alt+C",
                    click: () => loadInitial(filePath),
                },
            ],
        },
        {
            label: "Edit",
            submenu: [
                {
                    label: "Find",
                    accelerator: "CommandOrControl+F",
                    click: () => $(".search-container .search-graph button.toggle-search").click(),
                },
                {
                    label: "Undo",
                    accelerator: "CommandOrControl+Z",
                    click: () => undo(),
                },
                {
                    label: "Redo",
                    accelerator: "CommandOrControl+Y",
                    click: () => redo(),
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
    applyLayout(cy.nodes(), new BoxGridLayout(cy.nodes()).getLayout());
    updateWindowTitle(currentTitle);
}
function updateUI(
    {
        filePath,
        infoPanelState,
        elements,
    }: ISaveData,
    layout: Cy.LayoutOptions,
): Cy.Core {
    updateWindowTitle("Drawing graph...");
    const cy = cytoscape({
        container: $("#cy")[0], elements,
        boxSelectionEnabled: false,
        selectionType: "additive",
        // tslint:disable-next-line:no-any
        style: getCyStyle() as any,
        layout,
    });
    setMenuItems(filePath, cy);
    registerInfoPane(cy, infoPanelState);
    resetUndoRedo(cy);
    registerSearchBox(cy);
    panControls.register(cy);
    zoomControls.registerCy(cy);
    hovers.registerCy(cy);
    updateWindowTitle(`${path.basename(filePath)} UML`);
    $(".search-box input").focus();
    return cy;
}
function loadInitial(filePath: string) {
    const elements: Cy.ElementDefinition[] = computeDiagramForFile(filePath, updateWindowTitle);
    const cy = updateUI(
        {
            elements,
            filePath,
            infoPanelState: "",
        } as ISaveData,
        boxGridLayout(elements),
    );
    resetUndoRedo(cy);
}

loadInitial(remote.getGlobal("diagramArgs")[3]);
