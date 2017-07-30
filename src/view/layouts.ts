
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
export interface INodeHierarchy {
    directIds: string[];
    groups: INodeHierarchy[];
}
export class BoxGridLayout {
    constructor(
        private readonly eles: Cy.NodeCollection,
    ) { }

    public getLayout(): Cy.GridLayoutOptions {
        const maxWidth = this.eles.nodes(":childless").max((ele) => ele.data("nodeSize")).value;
        const padding = Math.max(0, 200 - maxWidth);
        const hierarchy = this.getHierarchy(this.eles);
        const positions = this.calcPositions(hierarchy);
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

    private getWidth(nodeCount: number): number {
        return Math.round(Math.sqrt(nodeCount));
    }

    private calcPositionsFor(
        ids: string[],
    ): string[][] {
        const posGrid: string[][] = [];
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
            this.getRow(posGrid, row)[col] = id;
            next();
        }
        return posGrid;
    }
    private insertGrid(parent: string[][], child: string[][], row: number, col: number): void {
        for (let i = 0; i < child.length; i++) {
            const childRow = child[i];
            for (let j = 0; j < childRow.length; j++) {
                const parentRow = this.getRow(parent, i + row);
                parentRow[j + col] = childRow[j];
            }
        }
        const lastRow = this.getRow(parent, row + child.length - 1);
        // complete the rectangle
        while (lastRow.length < col + child[0].length) {
            lastRow[lastRow.length] = "";
        }
    }
    private calcPosGrid({directIds, groups}: INodeHierarchy): string[][] {
        const grids = [
            this.calcPositionsFor(directIds),
            ...groups.map((g) => this.calcPosGrid(g)),
        ];
        const wrapThreshold = this.getWidth(this.getHierarchyNodeCount({directIds, groups}));
        // sort into descending height order
        grids.sort((a, b) => b.length - a.length);
        const posGrid: string[][] = [];
        let row = 0;
        for (const groupGrid of grids) {
            const groupWidth = groupGrid[0].length;
            while (this.getRow(posGrid, row).length + groupWidth > wrapThreshold) {
                row++;
            }
            const col = this.getRow(posGrid, row).length;
            this.insertGrid(posGrid, groupGrid, row, col);
        }
        return posGrid;
    }
    private calcPositions(nodes: INodeHierarchy): IGridPositions {
        const posGrid = this.calcPosGrid(nodes);
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

    private getHierarchyNodeCount({directIds, groups}: INodeHierarchy): number {
        return [directIds.length, ...groups.map((g) => this.getHierarchyNodeCount(g))].reduce((a, b) => a + b);
    }
    private getHierarchy(eles: Cy.NodeCollection, parentId?: string): INodeHierarchy {
        const directChildren = getNodes(eles, (n) => n.parent().id() === parentId);
        const parentIds = directChildren.nodes(":parent").map((n) => n.id());
        const directIds = directChildren.nodes(":childless").map((n) => n.id());
        return {
            directIds,
            groups: parentIds.map((id) => this.getHierarchy(eles, id)),
        };
    }
}

export function applyLayout(nodes: Cy.NodeCollection, layoutOptions: Cy.LayoutOptions) {
    const layout: Cy.Layouts = nodes.layout(layoutOptions) as any;
    layout.run();
}
