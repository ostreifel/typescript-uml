
const infoElement = $(".element-info");
export function showElementInfo(e: Cy.EventObject) {
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
    infoElement.append($("<div>").text("line " + node.data("startLine")));
    const lineCount = node.data("lineCount");
    if (lineCount > 0) {
        infoElement.append($("<div>").text("line count " + node.data("lineCount")));
    }
    infoElement.show();
}
function hide() {
    infoElement.html("");
    infoElement.hide();
}
