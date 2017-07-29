import { spawn } from "child_process";
import * as path from "path";
import * as React from "react";
import * as ReactDom from "react-dom";
import { IDiagramFilePosition } from "../diagram/DiagramModel";
import { getNodes } from "./getEles";

const infoElement = document.getElementsByClassName("element-info")[0];
let cy: Cy.Core;

class GraphHighlights {
    private target?: Cy.CollectionSelection & Cy.Singular;
    private incoming?: Cy.EdgeCollection;
    private outgoing?: Cy.EdgeCollection;
    public unselect() {
        if (this.target) {
            this.target.unselect();
            this.target = null;
        }
        if (this.incoming) {
            this.incoming.removeClass("incoming");
            this.incoming = null;
        }
        if (this.outgoing) {
            this.outgoing.removeClass("outgoing");
            this.outgoing = null;
        }
    }
    public selectNode(node: Cy.NodeCollection, syntheticEvent: boolean) {
        this.unselect();
        this.incoming = node.incomers().edges("");
        this.incoming.addClass("incoming");
        this.outgoing = node.outgoers().edges("");
        this.outgoing.addClass("outgoing");
        this.selectTarget(node, syntheticEvent);
    }
    public selectEdge(edge: Cy.EdgeCollection, syntheticEvent: boolean) {
        this.unselect();
        this.selectTarget(edge, syntheticEvent);
    }
    public getSelectedId(): string {
        return this.target ? this.target.id() : "";
    }
    private selectTarget(target: Cy.CollectionSelection & Cy.Singular, syntheticEvent: boolean) {
        if (syntheticEvent) {
            // the click even will select on its own normally
            target.select();
        }
        this.target = target;
    }
}
const highlighted = new GraphHighlights();

export function registerInfoPane(
    cy2: Cy.Core,
    startSelect: string,
) {
    cy = cy2;
    cy.on("click", showElementInfo);

    if (startSelect) {
        const node = getNodes(cy.nodes(), (n) => n.id() === startSelect);
        node.trigger("click", [true as any]);
    } else {
        cy.trigger("click", [true]);
    }
}
export function getInfoPaneState(): string {
    return highlighted.getSelectedId();
}

/**
 * @param supressToggle whether this was manually called by trigger
 */
function showElementInfo(e: Cy.EventObject, syntheticEvent?: boolean) {
    const target: Cy.CollectionElements = e.target;

    if (
        target.id && highlighted.getSelectedId() !== target.id()
    ) {
        if (target.isNode()) {
            const node = target as Cy.NodeCollection;
            highlighted.selectNode(node, syntheticEvent);
            showNode(node);
        } else if (target.isEdge()) {
            const edge = target as Cy.EdgeCollection;
            highlighted.selectEdge(edge, syntheticEvent);
            showEdge(edge);
        }
    } else {
        hide();
    }
    return;
}

function hide() {
    infoElement.innerHTML = "";
    highlighted.unselect();
}
function showEdge(edge: Cy.EdgeCollection) {
    ReactDom.render(<EdgeInfo edge={edge} />, infoElement);
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
            {this.posName(this.props.pos)}
        </a>;
    }
    private focusLine() {
        const {fileName, line, column} = this.props.pos;
        spawn("code", ["-g", `${fileName}:${line}:${column}`]);
    }
    private posName({fileName, line, column}: IDiagramFilePosition): string {
        return `${path.basename(fileName)}:${line}:${column}`;
    }
}

function showNode(node: Cy.NodeCollection) {
    ReactDom.render(<NodeInfo node={node} />, infoElement);
}
class NodeInfo extends React.Component<{ node: Cy.NodeCollection }, {}> {
    public render() {
        const { node } = this.props;
        const getData = node.data.bind(node);
        const inEdges = node.incomers().edges("");
        const outEdges = node.outgoers().edges("");
        return <div className="node">
            <h1 className="name" title={getData("id")}>{getData("name")}</h1>
            <div className="type">{getData("type")}</div>
            <PositionLink pos={getData("filePosition")}/>
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
