import { spawn } from "child_process";
import * as path from "path";
import * as React from "react";
import * as ReactDom from "react-dom";
import { IDiagramFilePosition } from "../diagram/DiagramModel";
import { getEdges } from "./getEles";

const infoElement = document.getElementsByClassName("element-info")[0];
let cy: Cy.Core;
let synthenticSelection = false;
let selected: string;
export function registerInfoPane(
    cy2: Cy.Core,
) {
    cy2.on("select unselect", "node, edge", showElementInfo);
    cy = cy2;
}

function showElementInfo(e: Cy.EventObject) {
    const target: Cy.CollectionElements = e.target;
    if (synthenticSelection) {
        return;
    }

    if (
        selected !== target.id()
    ) {
        selectOnly(target);
        if (target.isNode()) {
            showNode(target as Cy.NodeSingular);
        } else if (target.isEdge()) {
            showEdge(target as Cy.EdgeSingular);
        }
    } else {
        hide();
    }
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
function showEdge(edge: Cy.EdgeSingular) {
    ReactDom.render(<EdgeInfo edge={edge} />, infoElement);
}
class EdgeInfo extends React.Component<{ edge: Cy.EdgeSingular }, {}> {
    public render() {
        const { edge } = this.props;
        const getData = edge.data.bind(edge);
        synthenticSelection = true;
        edge.source().select();
        edge.target().select();
        synthenticSelection = false;
        const references: IDiagramFilePosition[] = getData("references");
        return <div className="edge">
            <div>{`${edge.source().data("name")} to ${edge.target().data("name")}`}</div>
            <div>{`${getData("weight")} references`}</div>
            {references.map((r) => <PositionLink pos={r} />)}
        </div>;
    }
}
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
    ReactDom.render(<NodeInfo node={node} />, infoElement);
}
class NodeInfo extends React.Component<{ node: Cy.NodeSingular }, {}> {
    public render() {
        const { node } = this.props;
        const getData = node.data.bind(node);
        const referencing = getEdges(cy.edges(), (e) => e.target().id() === node.id());
        const references = getEdges(cy.edges(), (e) => e.source().id() === node.id());
        synthenticSelection = true;
        referencing.select();
        references.select();
        synthenticSelection = false;
        return <div className="node">
            <h1 className="name">{getData("name")}</h1>
            <div className="type">{getData("type")}</div>
            <PositionLink pos={getData("position")}/>
            {getData("lineCount") > 1 ?
                <div>
                    {`${getData("lineCount")} lines`}
                </div> :
                null
            }
        </div>;
    }
}
