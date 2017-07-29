import { Toggle } from "office-ui-fabric-react/lib/components/toggle";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { getNodes } from "./getEles";

export interface IInitialGraphFilterState {
    showFilter: boolean;
    types: {[type: string]: boolean};
}
let currentState: IInitialGraphFilterState;
export function registerFilterPane(
    cy: Cy.Core,
    initialState: IInitialGraphFilterState,
) {
    currentState = initialState;
    ReactDOM.render(<GraphFilter cy={cy} initialState={initialState} />, $(".filter-container")[0]);
}
export function getCurrentFilterState() {
    return currentState;
}

interface IGraphFilterProps {
    cy: Cy.Core;
    initialState: IInitialGraphFilterState;
}
class GraphFilter extends React.Component<IGraphFilterProps, {showOptions: boolean}> {
    constructor(props) {
        super(props);
        this.state = {showOptions: props.initialState};
    }
    public render() {
        return <div className="filter">
            <button accessKey="f" title="Filter (alt+f)" onClick={this.toggleOptions.bind(this)}>
                <img src="./img/filter.png" alt="filter" width="16" />
            </button>
            <GraphOptions
                cy={this.props.cy}
                className={this.state.showOptions ? "" : "hidden"}
                initialTypeState={this.props.initialState.types}/>
        </div>;
    }
    public toggleOptions() {
        this.setState({showOptions: !this.state.showOptions});
    }
}

class GraphOptions extends React.Component<
    { cy: Cy.Core, className: string, initialTypeState: {[type: string]: boolean} },
    {}
> {
    public render() {
        const typesSet: { [type: string]: void } = {};
        this.props.cy.nodes().forEach((ele) => {
            const type = ele.data("type");
            if (type) {
                typesSet[type] = undefined;
            }
        });
        const initialTypes = this.props.initialTypeState;
        const types = Object.keys(typesSet).sort().map((type) =>
            <Toggle
                label={type}
                defaultChecked={!(type in initialTypes) && initialTypes[type]}
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
        currentState.types[type] = show;
        if (show) {
            nodes["show"]();
        } else {
            nodes["hide"]();
        }
    }
}
