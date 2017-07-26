import { spawn } from "child_process";
import * as path from "path";
import * as React from "react";
import * as ReactDom from "react-dom";

const infoElement = document.getElementsByClassName("element-info")[0];
export function showElementInfo(e: Cy.EventObject) {
    const node: Cy.NodeCollection = e.target;

    if ((e.type as Cy.CollectionEventName) === "select" && node.nonempty() && node.isNode()) {
        show(node);
    } else {
        hide();
    }
}

function show(node: Cy.NodeSingular) {
    ReactDom.render(<NodeInfo getData={node.data.bind(node)} />, infoElement);
}
function hide() {
    infoElement.innerHTML = "";
}

function focusLine(file: string, line: number, column: number) {
    spawn("code", ["-g", `${file}:${line}:${column}`]);
}

class NodeInfo extends React.Component<{getData: (key: string) => any}, {}> {
    public render() {
        const { getData } = this.props;
        return <div className="node-info">
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
        focusLine(getData("fileName"), getData("startLine"), getData("startColumn"));
    }
}
