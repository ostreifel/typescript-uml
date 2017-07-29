
import { getNodes } from "./getEles";

export function coseLayout(): Cy.CoseLayoutOptions {
    const layout = {
        name: "cose",
        numIter: 10000,
        randomize: false,
    } as Cy.CoseLayoutOptions;
    return layout;
}

export function gridLayout(): Cy.GridLayoutOptions {
    const layout = {
        name: "grid",
    } as Cy.GridLayoutOptions;
    return layout;
}

export function concentricLayout(): Cy.ConcentricLayoutOptions {
    const layout = {
        name: "concentric",
    } as Cy.ConcentricLayoutOptions;
    return layout;
}

export function circleLayout(): Cy.CircleLayoutOptions {
    const layout = {
        name: "circle",
    } as Cy.CircleLayoutOptions;
    return layout;
}
export function boxGridLayout(eles: Cy.NodeCollection): Cy.GridLayoutOptions {
    const boxLayout = new BoxGridLayout(eles);
    const layout = boxLayout.getLayout();
    return layout;
}
export interface INodePositions {
    [nodeId: string]: Cy.Position;
}
export function presetLayout(positions: INodePositions): Cy.PresetLayoutOptions {
    const layout = {
        name: "preset",
        positions,
    } as Cy.PresetLayoutOptions;
    return layout;
}
export function getPositions(eles: Cy.NodeCollection): INodePositions {
    const positions: INodePositions = {};
    eles.forEach((ele) => {
        positions[ele.id()] = ele.position();
    });
    return positions;
}

interface IGridPos {
    col: number;
    row: number;
}
interface IGridPositions {
    [id: string]: IGridPos;
}
export class BoxGridLayout {
    constructor(
        private readonly eles: Cy.NodeCollection,
    ) { }

    public getLayout(): Cy.GridLayoutOptions {
        const maxWidth = this.eles.nodes(":childless").max((ele) => ele.data("nodeSize")).value;
        const padding = Math.max(0, 200 - maxWidth);
        const positions = this.calcPositions();
        const position = (n: Cy.NodeSingular) => positions[n.id()];
        return {
            name: "grid",
            position: position as any, // typing here is wrong
            condense: true,
            avoidOverlapPadding: padding,
            fit: true,
        } as Cy.GridLayoutOptions;
    }

    private getRow(posGrid: string[][], i: number) {
        if (!posGrid[i]) {
            posGrid[i] = [];
        }
        return posGrid[i];
    }

    private setAvailableColumn(availableColumn: number[], row: number, col: number) {
        const val = availableColumn[row] || 0;
        if (val < col) {
            availableColumn[row] = col;
        }
    }

    private getAvailableColumn(availableColumn: number[], row?: number): number {
        if (typeof row !== "number" || !availableColumn[row]) {
            return 0;
        }
        return availableColumn[row];
    }

    private getWidth(nodeCount: number): number {
        return Math.round(Math.sqrt(nodeCount));
    }

    private calcPositionsFor(
        posGrid: string[][],
        availableColumns: number[],
        ids: string[],
        startCol: number,
        startRow: number,
    ): void {
        const wrapThreshold = this.getWidth(ids.length);
        let col = 0;
        let row = 0;
        function next() {
            col++;
            if (col >= wrapThreshold) {
                col = 0;
                row++;
            }
        }
        for (const id of ids) {
            this.getRow(posGrid, row + startRow)[col + startCol] = id;
            this.setAvailableColumn(availableColumns, row + startRow, startCol + wrapThreshold);
            next();
        }
    }
    private calcPositions() {
        const parented: { [parentId: string]: Cy.NodeCollection } = {};
        this.eles.nodes(":parent").map((p) => p.id()).forEach((parentId) => {
            parented[parentId] = getNodes(this.eles, (element: Cy.NodeSingular) => {
                return parentId === element.data("parent");
            });
        });
        const unparented = getNodes(this.eles, (element: Cy.NodeSingular) => {
            return !element.data("parent") && !element.isParent();
        });
        const nodeCollections: Cy.NodeCollection[] = [unparented];
        for (const parentId in parented) {
            nodeCollections.push(parented[parentId]);
        }

        // thresholds for boundries
        const elementCount = getNodes(this.eles, (element) => !element.isParent()).length;
        const wrapThreshold = this.getWidth(elementCount);
        let rowIdx = 0;
        let colIdex = 0;
        const posGrid: string[][] = [];
        const availableColumns: number[] = [];
        for (const nodeCollection of nodeCollections) {
            const width = this.getWidth(nodeCollection.length);
            while (this.getAvailableColumn(availableColumns, rowIdx) + width > wrapThreshold) {
                rowIdx++;
            }
            colIdex = this.getAvailableColumn(availableColumns, rowIdx);
            const ids: string[] = nodeCollection.map((n) => n.id());
            this.calcPositionsFor(posGrid, availableColumns, ids, colIdex, rowIdx);
        }
        const positions: IGridPositions = {};
        for (let i = 0; i < posGrid.length; i++) {
            const row = this.getRow(posGrid, i);
            for (let j = 0; j < row.length; j++) {
                if (row[j]) {
                    positions[row[j]] = { row: i, col: j };
                }
            }
        }
        return positions;
    }
}

export function applyLayout(nodes: Cy.NodeCollection, layoutOptions: Cy.LayoutOptions) {
    const layout: Cy.Layouts = nodes.layout(layoutOptions) as any;
    layout.run();
}
