
import { getNodes } from "./getNodes";

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

    private calcPositionsFor(eles: Cy.NodeCollection, startCol: number, startRow: number): void {
        const wrapThreshold = Math.ceil(Math.sqrt(eles.length));
        let col = 0;
        let row = 0;
        function next() {
            col++;
            if (col > wrapThreshold) {
                col = 0;
                row++;
            }
        }
        for (let i = 0; i < eles.length; i++) {
            this.getRow(row + startRow)[col + startCol] = eles[i].id();
            next();
        }
    }
    private calcPositions() {
        // const wrapThreshold = Math.ceil(Math.sqrt(this.elementCount));
        this.calcPositionsFor(this.unparented, 0, 0);
        for (const parentId in this.parented) {
            this.calcPositionsFor(this.parented[parentId], 0, this.posGrid.length);
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
