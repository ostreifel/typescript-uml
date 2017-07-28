
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
export class BoxGridLayout {
    private readonly elementCount: number;
    private readonly parented: { [parentId: string]: Cy.NodeCollection } = {};
    private readonly unparented: Cy.NodeCollection;
    private readonly positions: { [id: string]: IGridPos } = {};
    private readonly posGrid: string[][] = [];
    private readonly availableColumn: number[] = [];

    constructor(
        eles: Cy.NodeCollection,
    ) {
        this.elementCount = getNodes(eles, (element) => !element.isParent()).length;
        eles.nodes(":parent").map((p) => p.id()).forEach((parentId) => {
            this.parented[parentId] = getNodes(eles, (element: Cy.NodeSingular) => {
                return parentId === element.data("parent");
            });
        });
        this.unparented = getNodes(eles, (element: Cy.NodeSingular) => {
            return !element.data("parent") && !element.isParent();
        });
        this.calcPositions();
    }

    public getLayout(): Cy.GridLayoutOptions {
        return {
            name: "grid",
            position: this.position.bind(this),
            rows: this.maxRow(),
            cols: this.maxCol(),
            // nodeDimensionsIncludeLabels: true,
            condense: true,
            avoidOverlapPadding: 140,
            fit: true,
        } as Cy.GridLayoutOptions;
    }

    private position(node: Cy.NodeSingular): IGridPos {
        return this.positions[node.id()];
    }

    private maxRow() {
        return this.posGrid.length;
    }
    private maxCol() {
        let maxCol = 0;
        for (let i = 0; i < this.posGrid.length; i++) {
            if (this.posGrid[i] && this.posGrid[i].length > maxCol) {
                maxCol = this.posGrid[i].length;
            }
        }
        return maxCol;
    }

    private getRow(i: number) {
        if (!this.posGrid[i]) {
            this.posGrid[i] = [];
        }
        return this.posGrid[i];
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
            this.getRow(row + startRow)[col + startCol] = eles[i].id();
            this.setAvailableColumn(row + startRow, startCol + wrapThreshold);
            next();
        }
    }
    private calcPositions() {
        const wrapThreshold = this.getWidth(this.elementCount);
        const nodeCollections: Cy.NodeCollection[] = [this.unparented];
        for (const parentId in this.parented) {
            nodeCollections.push(this.parented[parentId]);
        }
        let rowIdx = 0;
        let colIdex = 0;
        for (const nodeCollection of nodeCollections) {
            const width = this.getWidth(nodeCollection.length);
            while (this.getAvailableColumn(rowIdx) + width > wrapThreshold) {
                rowIdx++;
            }
            colIdex = this.getAvailableColumn(rowIdx);
            this.calcPositionsFor(nodeCollection, colIdex, rowIdx);
        }
        for (let i = 0; i < this.posGrid.length; i++) {
            const row = this.getRow(i);
            for (let j = 0; j < row.length; j++) {
                if (row[j]) {
                    this.positions[row[j]] = { row: i, col: j };
                }
            }
        }
    }
}

export function applyLayout(nodes: Cy.NodeCollection, layoutOptions: Cy.LayoutOptions) {
    const layout: Cy.Layouts = nodes.layout(layoutOptions) as any;
    layout.run();
}
