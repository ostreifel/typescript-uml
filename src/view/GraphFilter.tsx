import { Toggle } from "office-ui-fabric-react/lib/components/toggle";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { getNodes } from "./getEles";

export function registerFilterPane(cy: Cy.Core) {
    ReactDOM.render(<GraphFilter cy={cy} />, $(".filter-container")[0]);
}

class GraphFilter extends React.Component<{ cy: Cy.Core }, {showOptions: boolean}> {
    constructor(props) {
        super(props);
        this.state = {showOptions: false};
    }
    public render() {
        return <div className="filter">
            <button accessKey="f" title="Filter (alt+f)" onClick={this.toggleOptions.bind(this)}>
                <img src="./img/filter.png" alt="filter" width="16" />
            </button>
            <GraphOptions cy={this.props.cy} className={this.state.showOptions ? "" : "hidden"}/>
        </div>;
    }
    public toggleOptions() {
        this.setState({showOptions: !this.state.showOptions});
    }
}

class GraphOptions extends React.Component<
    { cy: Cy.Core, className: string },
    {}
> {
    public shouldComponentUpdate() {
        return true;
    }
    public render() {
        const typesSet: { [type: string]: void } = {};
        this.props.cy.nodes().forEach((ele) => {
            const type = ele.data("type");
            if (type) {
                typesSet[type] = undefined;
            }
        });
        const types = Object.keys(typesSet).sort().map((type) =>
            <Toggle
                label={type}
                defaultChecked={true}
                className="option"
                onChanged={(checked) => this.onChange(type, checked)}
            />,
        );
        return <div className={`options ${this.props.className}`}>
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
