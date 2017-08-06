import { IconButton } from "office-ui-fabric-react/lib/Button";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { KeyCodes } from "office-ui-fabric-react/lib/Utilities";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { highlighted } from "./elementInfo";
import { getNodes } from "./getEles";

export function registerSearchBox(cy: Cy.Core) {
    ReactDOM.render(<SearchGraph nodes={cy.nodes()} />, $(".search-container")[0]);
}

function searchNodes(nodes: Cy.NodeCollection, searchString: string): Cy.NodeCollection | null {
    if (!searchString) {
        return null;
    }
    searchString = searchString.toLocaleLowerCase();
    function idx(n: Cy.NodeCollection) {
        return n.data("name").toLocaleLowerCase().indexOf(searchString);
    }
    const foundNodes = getNodes(nodes, (n) => {
        return idx(n) >= 0;
    });
    const sortedNodes = foundNodes.sort((a, b) => {
        return idx(a) - idx(b);
    });
    return sortedNodes;
}

class SearchGraph extends React.Component<{ nodes: Cy.NodeCollection }, {
    showSearch: boolean,
    searchString: string,
    selected: number,
    focusButton: boolean,
}> {
    private supressCancel: boolean;
    constructor(props) {
        super(props);
        this.state = { focusButton: true, searchString: "", selected: 0, showSearch: false };
    }
    public render() {
        const nodes = searchNodes(this.props.nodes, this.state.searchString);
        const nodeCount = nodes ? nodes.length : 0;

        return <div className="search-graph">
            {
                this.state.showSearch ?
                    [<SearchBox
                        onEnter={() => this.select(nodes && nodes[this.state.selected])}
                        onChanged={(searchString) => this.updateResults(searchString)}
                        onArrowDown={() => this.onArrowDown(nodeCount)}
                        onArrowUp={() => this.onArrowUp()}
                        onCancel={() => this.onCancel()}
                    />,
                    <SearchResults nodes={nodes} selected={this.state.selected} onSelect={(e) => this.select(e)} />] :
                    <IconButton
                        iconProps={{ iconName: "Search" }}
                        onClick={() => this.showSearch()}
                        autoFocus={this.state.focusButton}
                        className="toggle-search"
                        title="Search (Ctr + F)"
                    />
            }
        </div>;
    }
    private showSearch() {
        this.supressCancel = false;
        this.setState({ ...this.state, showSearch: true });
    }
    private onCancel() {
        if (!this.supressCancel && this.state.showSearch) {
            this.setState({ showSearch: false, searchString: "", selected: 0, focusButton: true });
        }
    }
    private select(selected: Cy.NodeCollection | null) {
        this.supressCancel = true;
        if (selected) {
            this.setState({ searchString: "", selected: 0, showSearch: false, focusButton: false });
            highlighted.select(selected);
        }
    }
    private updateResults(searchString: string) {
        this.setState({ searchString });
    }
    private onArrowDown(nodeCount) {
        const selected = this.state.selected + 1;
        if (selected < nodeCount) {
            this.setState({ ...this.state, selected });
        }
    }
    private onArrowUp() {
        if (this.state.selected > 0) {
            this.setState({ ...this.state, selected: this.state.selected - 1 });
        }
    }
}

class SearchBox extends React.Component<{
    onChanged: (text: string) => void,
    onEnter: () => void,
    onArrowUp: () => void,
    onArrowDown: () => void,
    onCancel: () => void,
}, { value: string }> {
    constructor(props) {
        super(props);
        this.state = { value: "" };
    }
    public render() {
        return <div className="search-box">
            <TextField
                className="text-box"
                onChanged={(value) => {
                    this.props.onChanged(value);
                    this.setState({ value });
                }}
                onKeyDown={(e) => this.onKeyDown(e as React.KeyboardEvent<HTMLInputElement>)}
                value={this.state.value}
                placeholder="Search..."
                autoFocus={true}
                onBlur={() => this.onBlur()}
            />
        </div>;
    }
    private onBlur() {
        setTimeout(this.props.onCancel, 300);
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
        } else if (e.keyCode === KeyCodes.escape) {
            this.props.onCancel();
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
    private resultItemRef: HTMLDivElement | null;
    public render() {
        return <div
            className={`result-item ${this.props.selected ? "focus" : ""}`}
            onClick={() => this.props.onSelect(this.props.node)}
            ref={(ref) => {this.resultItemRef = ref; this.scrollIntoViewIfNecessary(); }}
        >
            {this.props.node.data("name")}
        </div>;
    }
    public componentDidUpdate() {
        this.scrollIntoViewIfNecessary();
    }
    private scrollIntoViewIfNecessary() {
        const curr = this.resultItemRef;
        if (this.props.selected && curr && curr.parentElement) {
            const parent = curr.parentElement;
            const parentRect = parent.getBoundingClientRect();
            const rect = curr.getBoundingClientRect();
            if (rect.bottom > parentRect.bottom) {
                parent.scrollTop += rect.bottom - parentRect.bottom;
            } else if (rect.top < parentRect.top) {
                parent.scrollTop += rect.top - parentRect.top;
            }
        }
    }
}
