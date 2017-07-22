
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
function coseLayout(): Cy.CoseLayoutOptions {
    const layout = {
        name: "cose",
        numIter: 10000,
        randomize: false,
    } as Cy.CoseLayoutOptions;
    return layout;
}
function gridLayout(): Cy.GridLayoutOptions {
    const layout = {
        name: "grid",
    } as Cy.GridLayoutOptions;
    return layout;
}
function concentricLayout(): Cy.ConcentricLayoutOptions {
    const layout = {
        name: "concentric",
    } as Cy.ConcentricLayoutOptions;
    return layout;
}
function circleLayout(): Cy.CircleLayoutOptions {
    const layout = {
        name: "circle",
    } as Cy.CircleLayoutOptions;
    return layout;
}
function getNodes(cy: Cy.Core, filter: (n: Cy.NodeSingular) => boolean) {
    return cy.nodes(filter as any);
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
    const parentIds: {[parentId: string]: void} = {};
    elements.map((e) => e.data["parent"]).filter((p) => p).forEach((p) => parentIds[p] = undefined);
    for (const parentId of Object.keys(parentIds)) {
        const children = getNodes(cy, (element: Cy.NodeSingular) => {
            return parentId === element.data("parent");
        });
        applyLayout(children, gridLayout());
    }
    const parents = getNodes(cy, (element) => {
        return !element.data("parent") || (element.id() in parentIds);
    });
    applyLayout(parents, gridLayout());
    // TODO more advanced layout here - select neighborhoods
}
// $("#cy").click(run);
setTimeout(run, 0);
