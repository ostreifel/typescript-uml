import { TextField } from "office-ui-fabric-react/lib/TextField";
import { KeyCodes } from "office-ui-fabric-react/lib/Utilities";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { getNodes } from "./getEles";
import { highlighted } from "./elementInfo";

export function registerSearchBox(cy: Cy.Core) {
    ReactDOM.render(<SearchGraph nodes={cy.nodes()} />, $(".search-container")[0]);
}

function searchNodes(nodes: Cy.NodeCollection, searchString: string): Cy.NodeCollection | null {
    if (!searchString) {
        return null;
    }
    searchString = searchString.toLocaleLowerCase();
    return getNodes(nodes, (n) => {
        const name: string = n.data("name");
        return name.toLocaleLowerCase().indexOf(searchString) >= 0;
    });
}

class SearchGraph extends React.Component<{ nodes: Cy.NodeCollection }, {searchString: string, selected: number}> {
    private reset?: () => void;
    constructor(props) {
        super(props);
        this.state = {searchString: "", selected: 0};
    }
    public render() {
        const nodes = searchNodes(this.props.nodes, this.state.searchString);
        const nodeCount = nodes ? nodes.length : 0;

        return <div className="search-graph">
            <SearchBox
                onEnter={() => this.select(nodes && nodes[this.state.selected])}
                onChanged={(searchString) => this.updateResults(searchString)}
                onArrowDown={() => this.onArrowDown(nodeCount)}
                onArrowUp={() => this.onArrowUp()}
                setReset={(reset) => this.reset = reset}
            />
            <SearchResults nodes={nodes} selected={this.state.selected} onSelect={(e) => this.select(e)} />
        </div>;
    }
    private select(selected: Cy.NodeCollection | null) {
        if (selected) {
            if (this.reset) {
                this.reset();
            }
            highlighted.select(selected);
        }
    }
    private updateResults(searchString: string) {
        this.setState({searchString});
    }
    private onArrowDown(nodeCount) {
        const selected = this.state.selected + 1;
        if (selected < nodeCount) {
            this.setState({ ...this.state, selected });
        }
    }
    private onArrowUp() {
        if (this.state.selected > 0) {
            this.setState({ ...this.state, selected: this.state.selected - 1});
        }
    }
}

class SearchBox extends React.Component<{
    onChanged: (text: string) => void,
    onEnter: () => void,
    onArrowUp: () => void,
    onArrowDown: () => void,
    setReset(reset: () => void),
}, {value: string}> {
    constructor(props) {
        super(props);
        this.state = {value: ""};
        props.setReset(() => this.reset());
    }
    public render() {
        return <div className="search-box">
            <TextField
                className="text-box"
                onChanged={(value) => {
                    this.props.onChanged(value);
                    this.setState({value});
                }}
                onKeyDown={(e) => this.onKeyDown(e as React.KeyboardEvent<HTMLInputElement>)}
                value={this.state.value}
            />
        </div>;
    }
    private reset() {
        this.setState({value: ""}, () => this.props.onChanged(""));
    }
    private onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        function stop() {
            e.stopPropagation();
            e.preventDefault();
        }
        if (e.keyCode === KeyCodes.up) {
            this.props.onArrowUp();
            stop();
        } else if (e.keyCode === KeyCodes.down) {
            this.props.onArrowDown();
            stop();
        } else if (e.keyCode === KeyCodes.enter) {
            this.props.onEnter();
            stop();
        }
    }
}

class SearchResults extends React.Component<{
    nodes: Cy.NodeCollection | null,
    selected: number,
    onSelect: (e: Cy.NodeCollection) => void,
}, {}> {
    public render() {
        return this.props.nodes ? <div className="search-results">
            {this.props.nodes.map((n, i) =>
                <ResultItem node={n} selected={i === this.props.selected} onSelect={this.props.onSelect} />,
            )}
        </div> : null;
    }
}

class ResultItem extends React.Component<{
    node: Cy.NodeCollection,
    selected: boolean,
    onSelect: (e: Cy.NodeCollection) => void,
}, {}> {
    public render() {
        return <div
            className={`result-item ${this.props.selected ? "focus" : ""}`}
            onClick={() => this.props.onSelect(this.props.node)}
        >
            {this.props.node.data("name")}
        </div>;
    }
}
