import { spawn } from "child_process";
import * as path from "path";
import * as React from "react";
import * as ReactDom from "react-dom";

const infoElement = document.getElementsByClassName("element-info")[0];
export function registerInfoPane(
    on: (events: Cy.EventNames, selector: Cy.Selector, handler: Cy.EventHandler) => void,
) {
    on("select unselect", "node", showElementInfo);
}

function showElementInfo(e: Cy.EventObject) {
    const target: Cy.SingularData = e.target;

    if ((e.type as Cy.CollectionEventName) === "select" && target.isNode()) {
        if (target.isNode()) {
            showNode(target as Cy.NodeSingular);
        } else if (target.isEdge) {
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
        const { getData } = this.props;
        return <div className="edge">
            <div>{`${getData("weight")} references`}</div>
        </div>;
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
            <a className="line" onClick={this.focusLine.bind(this)} href="#">
                {`${path.basename(getData("fileName"))}:${getData("startLine")}:${getData("startColumn")}`}
            </a>
            {getData("lineCount") > 1 ?
                <div>
                    {`${getData("lineCount")} lines`}
                </div> :
                null
            }
        </div>;
    }
    private focusLine() {
        const { getData } = this.props;
        const file = getData("fileName");
        const line = getData("startLine");
        const column = getData("startColumn");
        spawn("code", ["-g", `${file}:${line}:${column}`]);
    }
}
