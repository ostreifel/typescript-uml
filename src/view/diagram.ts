
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
            "border-color": "black",
            "border-opacity": "1",
            "border-width": "1",
            "border-style": "solid",
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
            // "background-color": "black",
            "line-color": "red",
            "source-arrow-color": "red",
            "target-arrow-color": "red",
            "border-color": "white",
            "border-opacity": "1",
            "border-width": "5",
            "border-style": "solid",
        })
        .selector(".faded")
        .css({
            "opacity": 0.25,
            "text-opacity": 0,
        });
}

namespace Layouts {
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

    export function applyLayout(nodes: Cy.NodeCollection, layoutOptions: Cy.LayoutOptions) {
        const layout: Cy.Layouts = nodes.layout(layoutOptions) as any;
        layout.run();
    }
}
namespace NodeInfo {
    const infoElement = $(".element-info");
    export function update(e: Cy.EventObject) {
        const node: Cy.NodeCollection = e.target;

        if ((e.type as Cy.CollectionEventName) === "select" && node.nonempty() && node.isNode()) {
            show(node);
        } else {
            hide();
        }
    }
    function show(node: Cy.NodeSingular) {
        infoElement.append($("<div>").text(node.data("name")));
        infoElement.append($("<div>").text(node.data("type")));
        infoElement.append($("<div>").text("line " + node.data("line")));
        infoElement.show();
    }
    function hide() {
        infoElement.html("");
        infoElement.hide();
    }
}
// tslint:disable-next-line:max-classes-per-file
class GraphFilter {
    private $filterOptions = $(".filter-options");
    constructor(private readonly cy: Cy.Core) {
    }
    public register(): void {
        const typesSet: {[type: string]: void} = {};
        this.cy.nodes().forEach((ele) => {
            const type = ele.data("type");
            if (type) {
                typesSet[type] = undefined;
            }
        });
        const types = Object.keys(typesSet).sort();
        for (const type of types) {
            const typeId = `option-${type}`;
            const $option = $("<div class=filter-option/>");
            const $label = $(`<label for="${typeId}"/>`);
            $label.text(type);
            const $checkbox = $("<input type=checkbox checked/>");
            this.$filterOptions.append($option.append($label.append($checkbox)));

            const onChange = this.onChange.bind(this);
            $checkbox.change(function(e) { onChange(type, $(this).is(":checked")); });
        }
    }
    private onChange(type: string, show: boolean) {
        const nodes = getNodes(this.cy.nodes(), (node) => node.data("type") === type);
        if (show) {
            nodes["show"]();
        } else {
            nodes["hide"]();
        }
    }
}

function getNodes(eles: Cy.NodeCollection, filter: (n: Cy.NodeSingular) => boolean) {
    return eles.nodes(filter as any);
}
function run() {
    const elements: Cy.ElementDefinition[] = JSON.parse($("#models").html());
    const cy = cytoscape({
        container: $("#cy"),
        elements,
        boxSelectionEnabled: false,
        selectionType: "single",
        style: getStyle(),
        layout: {name: "null"} as Cy.NullLayoutOptions,
    });
    cy.on("select unselect", "node", NodeInfo.update);
    const boxLayout = new Layouts.BoxGridLayout(cy, cy.nodes());
    Layouts.applyLayout(cy.nodes(), boxLayout.getLayout());
    $(".more-options").click(() => $(".filter-options").toggle());
    new GraphFilter(cy).register();
}
// $("#cy").click(run);
setTimeout(run, 0);
