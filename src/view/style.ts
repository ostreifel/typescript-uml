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
            "text-valign": "center",
            "border-color": "black",
            "border-opacity": "1",
            "border-width": "3",
            "border-style": "solid",
        })
        .selector(":parent")
        .css({
            "text-valign": "top",
        })
        .selector("edge")
        .css({
            "curve-style": "bezier",
            "line-color": "white",
            "target-arrow-color": "white",
            "target-arrow-shape": "triangle",
            "width": "data(weight)",
        })
        .selector(":selected")
        .css({
            // dark yellow
            "line-color": "#c4c400",
            "source-arrow-color": "#c4c400",
            "target-arrow-color": "#c4c400",
            "border-color": "white",
            "border-opacity": "1",
            "border-width": "5",
            "border-style": "solid",
        })
        .selector(".outgoing")
        .css({
            // dark orange
            "line-color": "#d68f00",
            "source-arrow-color": "#d68f00",
            "target-arrow-color": "#d68f00",
        })
        .selector(".incoming")
        .css({
            "line-color": "red",
            "source-arrow-color": "red",
            "target-arrow-color": "red",
        })
        .selector(".faded")
        .css({
            "opacity": 0.25,
            "text-opacity": 0,
        });
}
