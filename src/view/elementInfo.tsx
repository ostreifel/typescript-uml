import { spawn } from "child_process";
import * as path from "path";
import * as React from "react";
import * as ReactDom from "react-dom";
import { IDiagramFilePosition } from "../diagram/DiagramModel";

const infoElement = document.getElementsByClassName("element-info")[0];
let cy: Cy.Core;
let synthenticSelection = false;
let selected: string;
export function registerInfoPane(
    cy2: Cy.Core,
) {
    cy2.on("click", showElementInfo);
    cy = cy2;
}

/**
 * @param supressToggle whether this was manually called by trigger
 */
function showElementInfo(e: Cy.EventObject, supressToggle?: boolean) {
    const target: Cy.CollectionElements = e.target;
    if (synthenticSelection) {
        return true;
    }

    if (
        target.id && selected !== target.id()
    ) {
        selectOnly(target);
        if (target.isNode()) {
            showNode(target as Cy.NodeCollection);
        } else if (target.isEdge()) {
            showEdge(target as Cy.EdgeCollection);
        }
    } else {
        hide();
    }
    // whatever the targets selection state is here will be toggled
    // by the select event that fires after click events
    if (!supressToggle && target.select) {
        if (target.selected()) {
            target.unselect();
        } else {
            target.select();
        }
    }
    return false;
}
function selectOnly(ele: Cy.CollectionElements) {
    selected = ele.id();
    synthenticSelection = true;
    cy.elements().unselect();
    ele.select();
    synthenticSelection = false;
}

function hide() {
    infoElement.innerHTML = "";
    selected = "";
    synthenticSelection = true;
    cy.elements().unselect();
    synthenticSelection = false;
}
function showEdge(edge: Cy.EdgeCollection) {
    ReactDom.render(<EdgeInfo edge={edge} />, infoElement);
}
function posName({fileName, line, column}: IDiagramFilePosition): string {
    return `${path.basename(fileName)}:${line}:${column}`;
}
class NodeLink extends React.Component<{node: Cy.NodeCollection}, {}> {
    public render() {
        return <a href="#"
            onClick={() => this.selectNode()}
            title={this.props.node.id()}
        >
            {this.props.node.data("name")}
        </a>;
    }
    private selectNode() {
        this.props.node.trigger("click", [true as any]);
    }
}
class EdgeInfo extends React.Component<{ edge: Cy.EdgeCollection }, {}> {
    public render() {
        const { edge } = this.props;
        const getData = edge.data.bind(edge);
        const references: IDiagramFilePosition[] = getData("references");
        return <div className="edge">
            <div>
                <NodeLink node={edge.source()} />
                {" to "}
                <NodeLink node={edge.target()} />
            </div>
            <div>{`${getData("weight")} references`}</div>
            {references.map((r) => <PositionLink pos={r} />)}
        </div>;
    }
}
class PositionLink extends React.Component<{pos: IDiagramFilePosition}, {}> {
    public render() {
        return <a className="line" onClick={this.focusLine.bind(this)} href="#">
            {posName(this.props.pos)}
        </a>;
    }
    private focusLine() {
        const {fileName, line, column} = this.props.pos;
        spawn("code", ["-g", `${fileName}:${line}:${column}`]);
    }
}

function showNode(node: Cy.NodeCollection) {
    ReactDom.render(<NodeInfo node={node} />, infoElement);
}
class NodeInfo extends React.Component<{ node: Cy.NodeCollection }, {}> {
    public render() {
        const { node } = this.props;
        const getData = node.data.bind(node);
        synthenticSelection = true;
        node.connectedEdges().select();
        synthenticSelection = false;
        const inEdges = node.incomers().edges("");
        const outEdges = node.outgoers().edges("");
        return <div className="node">
            <h1 className="name" title={getData("id")}>{getData("name")}</h1>
            <div className="type">{getData("type")}</div>
            <PositionLink pos={getData("position")}/>
            {getData("lineCount") > 1 ?
                <div>
                    {`${getData("lineCount")} lines`}
                </div> :
                null
            }
            {
                inEdges.length > 0 ?
                <div className="reference-group references-to-group">
                    <h2>Referenced By</h2>
                    <div className="references">
                        {inEdges.map((e) => <NodeLink node={e.source()} />)}
                    </div>
                </div> :
                null
            }
            {
                outEdges.length > 0 ?
                <div className="reference-group references-from-group">
                    <h2>References</h2>
                    <div className="references">
                        {outEdges.map((e) => <NodeLink node={e.target()} />)}
                    </div>
                </div> :
                null
            }
        </div>;
    }
}
