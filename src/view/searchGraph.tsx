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
    constructor(props) {
        super(props);
        this.state = {searchString: "", selected: 0};
    }
    public render() {
        const nodes = searchNodes(this.props.nodes, this.state.searchString);
        const nodeCount = nodes ? nodes.length : 0;

        return <div className="search-graph">
            <SearchBox
                onEnter={() => this.selectFirst(nodes && nodes[this.state.selected])}
                onChanged={(searchString) => this.updateResults(searchString)}
                onArrowDown={() => this.onArrowDown(nodeCount)}
                onArrowUp={() => this.onArrowUp()}
            />
            <SearchResults nodes={nodes} selected={this.state.selected} />
        </div>;
    }
    private selectFirst(selected: Cy.NodeCollection | null) {
        if (selected) {
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
}, {}> {
    public render() {
        return <div className="search-box">
            <TextField className="text-box" onChanged={this.props.onChanged} onKeyDown={(e) => this.onKeyDown(e as React.KeyboardEvent<HTMLInputElement>)}/>
        </div>;
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

class SearchResults extends React.Component<{nodes: Cy.NodeCollection | null, selected: number}, {}> {
    public render() {
        return this.props.nodes ? <div className="search-results">
            {this.props.nodes.map((n, i) =>
                <ResultItem node={n} selected={i === this.props.selected} />,
            )}
        </div> : null;
    }
}

class ResultItem extends React.Component<{node: Cy.NodeCollection, selected: boolean}, {}> {
    public render() {
        return <div className={`result-item ${this.props.selected ? "focus" : ""}`}>
            {this.props.node.data("name")}
        </div>;
    }
}
