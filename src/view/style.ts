export function getCyStyle(): any {
    // tslint:disable-next-line:no-string-literal
    return cytoscape["stylesheet"]()
        .selector("node")
        .css({
            "background-color": "data(color)",
            "color": "white",
            "shape": "data(shape)",
            "content": "data(name)",
            "height": "data(nodeSize)",
            "width": "data(nodeSize)",
            "text-outline-color": "black",
            "text-outline-width": 2,
            "text-valign": "data(valign)",
            "border-color": "black",
            "border-opacity": "1",
            "border-width": "3",
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
