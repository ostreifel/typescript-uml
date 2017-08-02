import { Toggle } from "office-ui-fabric-react/lib/components/toggle";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { getNodes } from "./getEles";
import { UndoRedoAction } from "./undoRedo/undoRedo";

export interface IFilterData {
    showFilter: boolean;
    types: { [type: string]: boolean };
}
export function registerFilterPane(
    cy: Cy.Core,
    initialState: IFilterData,
) {
    filterAction.attach(cy);
    updateFilter(initialState, cy);
}
let currentState: IFilterData;
export function getCurrentFilterState() {
    return currentState;
}
function updateFilter(initialState: IFilterData, cy: Cy.Core) {
    currentState = initialState;
    $(".filter-container").html("");
    ReactDOM.render(<GraphFilter cy={cy} initialState={initialState} />, $(".filter-container")[0]);
}

interface IFilterActionArgs {
    start: IFilterData;
    end: IFilterData;
}
class FilterAction extends UndoRedoAction<IFilterActionArgs> {
    private cy: Cy.Core;
    constructor() {
        super("filter");
    }
    public do({ end }: IFilterActionArgs): void {
        updateFilter(end, this.cy);
    }
    public undo({ start }: IFilterActionArgs): void {
        updateFilter(start, this.cy);
    }
    public attach(cy: Cy.Core) {
        this.detach();
        this.cy = cy;
    }
    public detach() {
        this.cy = null;
    }

}
const filterAction = new FilterAction();

interface IGraphFilterProps {
    cy: Cy.Core;
    initialState: IFilterData;
}
class GraphFilter extends React.Component<IGraphFilterProps, {}> {
    public render() {
        return <div className="filter">
            <button accessKey="f" title="Filter (alt+f)" onClick={this.toggleOptions.bind(this)}>
                <img src="./img/filter.png" alt="filter" width="16" />
            </button>
            <GraphOptions
                cy={this.props.cy}
                className={this.props.initialState.showFilter ? "" : "hidden"}
                filterData={this.props.initialState} />
        </div>;
    }
    public toggleOptions() {
        const start = this.props.initialState;
        const end: IFilterData = { ...start, showFilter: !start.showFilter };
        filterAction.push({ start, end });
    }
}

interface IGraphOptionProps {
    cy: Cy.Core;
    className: string;
    filterData: IFilterData;
}
class GraphOptions extends React.Component<
    IGraphOptionProps,
    {}
    > {
    constructor(props: IGraphOptionProps) {
        super(props);
    }
    public render() {
        const { types: typesSelected } = this.props.filterData;
        const typesSet: { [type: string]: boolean } = {};
        this.props.cy.nodes().forEach((ele) => {
            const type = ele.data("type");
            if (type) {
                const enabled = !(type in typesSelected) || typesSelected[type];
                typesSet[type] = enabled;
            }
        });
        this.toggleNodes(typesSet);
        const types = Object.keys(typesSet).sort().map((type) =>
            <Toggle
                label={type}
                defaultChecked={typesSet[type]}
                className="option"
                onChanged={(checked) => this.onChange(type, checked)}
            />,
        );
        return <div className={`options ${this.props.className}`}>
            {types}
        </div>;
    }
    private toggleNodes(types: {[type: string]: boolean}) {
        for (const type in types) {
            const nodes = getNodes(this.props.cy.nodes(), (node) => node.data("type") === type);
            if (types[type]) {
                nodes["show"]();
            } else {
                nodes["hide"]();
            }
        }
    }
    private onChange(type: string, show: boolean) {
        const start = this.props.filterData;
        const currentTypes = start.types;
        const end: IFilterData = {...start, types: {...currentTypes, [type]: show}};
        filterAction.push({start, end});
    }
}
