import { getNodes } from "./getNodes";

export class GraphFilter {
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
