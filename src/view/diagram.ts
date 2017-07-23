
function getStyle(): any {
    // tslint:disable-next-line:no-string-literal
    return cytoscape["stylesheet"]()
        .selector("node")
        .css({
            "background-color": "data(color)",
            "color": "white",
            "shape": "data(shape)",
            "content": "data(name)",
            "text-outline-color": "black",
            "text-outline-width": 2,
            "text-valign": "data(valign)",
        })
        .selector("edge")
        .css({
            "curve-style": "bezier",
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "width": "data(weight)",
        })
        .selector(":selected")
        .css({
            "background-color": "black",
            "line-color": "black",
            "source-arrow-color": "black",
            "target-arrow-color": "black",
        })
        .selector(".faded")
        .css({
            "opacity": 0.25,
            "text-opacity": 0,
        });
}

interface IGridPos {
    col: number;
    row: number;
}
class BoxGridLayout {
    private readonly elementCount: number;
    private readonly parented: { [parentId: string]: Cy.NodeCollection } = {};
    private readonly unparented: Cy.NodeCollection;
    private readonly positions: {[id: string]: IGridPos} = {};
    private readonly posGrid: string[][] = [];

    constructor(
        private readonly cy: Cy.Core,
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
        const wrapThreshold = Math.ceil(Math.sqrt(this.elementCount));
        this.calcPositionsFor(this.unparented, 0, 0);
        for (const parentId in this.parented) {
            this.calcPositionsFor(this.parented[parentId], 0, this.posGrid.length);
        }
        for (let i = 0; i < this.posGrid.length; i++) {
            const row = this.getRow(i);
            for (let j = 0; j < row.length; j++) {
                if (row[j]) {
                    this.positions[row[j]] = {row: i, col: j};
                }
            }
        }
    }
}

// tslint:disable-next-line:max-classes-per-file
class Layouts {
    public static coseLayout(): Cy.CoseLayoutOptions {
        const layout = {
            name: "cose",
            numIter: 10000,
            randomize: false,
        } as Cy.CoseLayoutOptions;
        return layout;
    }

    public static gridLayout(): Cy.GridLayoutOptions {
        const layout = {
            name: "grid",
        } as Cy.GridLayoutOptions;
        return layout;
    }

    public static concentricLayout(): Cy.ConcentricLayoutOptions {
        const layout = {
            name: "concentric",
        } as Cy.ConcentricLayoutOptions;
        return layout;
    }

    public static circleLayout(): Cy.CircleLayoutOptions {
        const layout = {
            name: "circle",
        } as Cy.CircleLayoutOptions;
        return layout;
    }
}
function getNodes(eles: Cy.NodeCollection, filter: (n: Cy.NodeSingular) => boolean) {
    return eles.nodes(filter as any);
}
function applyLayout(nodes: Cy.NodeCollection, layoutOptions: Cy.LayoutOptions) {
    const layout: Cy.Layouts = nodes.layout(layoutOptions) as any;
    layout.run();
}
function run() {
    const elements: Cy.ElementDefinition[] = JSON.parse($("#models").html());
    const cy = cytoscape({
        container: $("#cy"),
        elements,
        autounselectify: true,
        boxSelectionEnabled: false,
        style: getStyle(),
        layout: {name: "null"} as Cy.NullLayoutOptions,
    });
    const boxLayout = new BoxGridLayout(cy, cy.nodes());
    applyLayout(cy.nodes(), boxLayout.getLayout());
}
// $("#cy").click(run);
setTimeout(run, 0);
