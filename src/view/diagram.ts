
function run() {
    const layout = {
            name: "cose",
            numIter: 10000,
            randomize: false,
    } as Cy.CoseLayoutOptions;
    const cy = cytoscape({
        container: $("#cy"),
        elements: JSON.parse($("#models").html()),

        autounselectify: true,
        boxSelectionEnabled: false,

        // tslint:disable-next-line:no-string-literal
        style: cytoscape["stylesheet"]()
            .selector("node")
            .css({
                "background-color": "blue",
                "color": "white",
                "content": "data(name)",
                "text-outline-color": "black",
                "text-outline-width": 2,
                "text-valign": "center",
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
            }),

        layout,

    });
}
setTimeout(run, 0);
