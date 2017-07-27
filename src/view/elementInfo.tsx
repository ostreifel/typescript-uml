import { spawn } from "child_process";
import * as path from "path";
import * as React from "react";
import * as ReactDom from "react-dom";
import { IDiagramFilePosition } from "../diagram/DiagramModel";

const infoElement = document.getElementsByClassName("element-info")[0];
export function registerInfoPane(
    on: (events: Cy.EventNames, selector: Cy.Selector, handler: Cy.EventHandler) => void,
) {
    on("select unselect", "node, edge", showElementInfo);
}

function showElementInfo(e: Cy.EventObject) {
    const target: Cy.SingularData = e.target;

    if ((e.type as Cy.CollectionEventName) === "select") {
        if (target.isNode()) {
            showNode(target as Cy.NodeSingular);
        } else if (target.isEdge()) {
            showEdge(target as Cy.EdgeSingular);
        }
    } else {
        hide();
    }
}

function hide() {
    infoElement.innerHTML = "";
}
function showEdge(edge: Cy.EdgeSingular) {
    ReactDom.render(<EdgeInfo getData={edge.data.bind(edge)} />, infoElement);
}
class EdgeInfo extends React.Component<{ getData: (key: string) => any }, {}> {
    public render() {
        const references: IDiagramFilePosition[] = this.props.getData("references");
        const { getData } = this.props;
        return <div className="edge">
            <div>{`${getData("weight")} references`}</div>
            {references.map((r) => <PositionLink pos={r} />)}
        </div>;
    }
}
// tslint:disable-next-line:max-classes-per-file
class PositionLink extends React.Component<{pos: IDiagramFilePosition}, {}> {
    public render() {
        const {fileName, line, column} = this.props.pos;
        return <a className="line" onClick={this.focusLine.bind(this)} href="#">
            {`${path.basename(fileName)}:${line}:${column}`}
        </a>;
    }
    private focusLine() {
        const {fileName, line, column} = this.props.pos;
        spawn("code", ["-g", `${fileName}:${line}:${column}`]);
    }
}

function showNode(node: Cy.NodeSingular) {
    ReactDom.render(<NodeInfo getData={node.data.bind(node)} />, infoElement);
}
// tslint:disable-next-line:max-classes-per-file
class NodeInfo extends React.Component<{ getData: (key: string) => any }, {}> {
    public render() {
        const { getData } = this.props;
        return <div className="node">
            <h1 className="name">{getData("name")}</h1>
            <div className="type">{getData("type")}</div>
            <PositionLink pos={this.props.getData("position")}/>
            {getData("lineCount") > 1 ?
                <div>
                    {`${getData("lineCount")} lines`}
                </div> :
                null
            }
        </div>;
    }
}
