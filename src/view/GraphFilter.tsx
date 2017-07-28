import * as React from "react";
import * as ReactDOM from "react-dom";
import { getNodes } from "./getNodes";

const $filterOptionsContainer = $(".filter-options");
export function registerFilterPane(cy: Cy.Core) {
    $(".more-options").click(() => $(".filter-options").toggle());
    $filterOptionsContainer.html("");
    ReactDOM.render(<GraphFilter cy={cy} />, $filterOptionsContainer[0]);
}

export class GraphFilter extends React.Component<{ cy: Cy.Core }, {}> {
    public render() {
        const typesSet: { [type: string]: void } = {};
        this.props.cy.nodes().forEach((ele) => {
            const type = ele.data("type");
            if (type) {
                typesSet[type] = undefined;
            }
        });
        const types = Object.keys(typesSet).sort().map((type) =>
            <div className="filter-option">
                <label>
                    <input defaultChecked={true} type="checkbox" onChange={
                        (e) => this.onChange(type, e.target.checked)
                    } />
                    {type}
                </label>
            </div>,
        );
        return <div>
            {types}
        </div>;
    }
    private onChange(type: string, show: boolean) {
        const nodes = getNodes(this.props.cy.nodes(), (node) => node.data("type") === type);
        if (show) {
            nodes["show"]();
        } else {
            nodes["hide"]();
        }
    }
}
