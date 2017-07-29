
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
    private readonly availableColumn: number[] = [];

    constructor(
        private readonly eles: Cy.NodeCollection,
    ) { }

    public getLayout(): Cy.GridLayoutOptions {
        const maxWidth = this.eles.nodes(":childless").max((ele) => ele.data("nodeSize")).value;
        const padding = Math.max(0, 200 - maxWidth);
        const positions = this.calcPositions();
        return {
            name: "grid",
            position: (n: Cy.NodeSingular) => positions[n.id()],
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

    private setAvailableColumn(row: number, col: number) {
        const val = this.availableColumn[row] || 0;
        if (val < col) {
            this.availableColumn[row] = col;
        }
    }

    private getAvailableColumn(row?: number): number {
        if (typeof row !== "number" || !this.availableColumn[row]) {
            return 0;
        }
        return this.availableColumn[row];
    }

    private getWidth(nodeCount: number): number {
        return Math.round(Math.sqrt(nodeCount));
    }

    private calcPositionsFor(
        posGrid: string[][],
        eles: Cy.NodeCollection,
        startCol: number,
        startRow: number,
    ): void {
        const wrapThreshold = this.getWidth(eles.length);
        let col = 0;
        let row = 0;
        function next() {
            col++;
            if (col >= wrapThreshold) {
                col = 0;
                row++;
            }
        }
        for (let i = 0; i < eles.length; i++) {
            this.getRow(posGrid, row + startRow)[col + startCol] = eles[i].id();
            this.setAvailableColumn(row + startRow, startCol + wrapThreshold);
            next();
        }
    }
    private calcPositions() {
        const elementCount = getNodes(this.eles, (element) => !element.isParent()).length;
        const wrapThreshold = this.getWidth(elementCount);

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
        let rowIdx = 0;
        let colIdex = 0;
        const posGrid: string[][] = [];
        for (const nodeCollection of nodeCollections) {
            const width = this.getWidth(nodeCollection.length);
            while (this.getAvailableColumn(rowIdx) + width > wrapThreshold) {
                rowIdx++;
            }
            colIdex = this.getAvailableColumn(rowIdx);
            this.calcPositionsFor(posGrid, nodeCollection, colIdex, rowIdx);
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
