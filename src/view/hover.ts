export class Hover {
    private cy: Cy.Core;
    public registerCy(cy: Cy.Core) {
        this.cy = cy;
        this.cy.on("mouseover", "node, edge", (e: Cy.EventObject) => {
            this.enter(e.target);
        });
        this.cy.on("mouseout", "node, edge", (e: Cy.EventObject) => {
            this.exit(e.target);
        });
    }
    public enter(ele: Cy.NodeCollection | Cy.EdgeCollection) {
        ele.addClass("hover");
    }
    public exit(ele: Cy.NodeCollection | Cy.EdgeCollection) {
        ele.removeClass("hover");
    }
}

export const hovers = new Hover();
