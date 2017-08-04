import { spawn } from "child_process";
import * as path from "path";
import * as React from "react";
import * as ReactDom from "react-dom";
import { IDiagramFilePosition } from "../diagram/DiagramModel";
import { getNodes } from "./getEles";
import { ISelectAction, SelectAction } from "./undoRedo/SelectAction";
import { toggleNodeAction } from "./undoRedo/ToggleNode";
import { toggleTypeAction } from "./undoRedo/ToggleType";

const infoElement = document.getElementsByClassName("element-info")[0];

class GraphHighlights {
    private cy?: Cy.Core;
    private selectAction = new SelectAction(showInfo, hideInfo);
    private targetId: string;
    public getSelectedId() {
        return this.targetId;
    }
    public select(ele?: Cy.CollectionElements, syntheticEvent: boolean = false): void {
        const args: ISelectAction = {
            startSelect: this.targetId,
            endSelect: ele ? ele.id() : "",
        };
        this.targetId = args.endSelect;
        this.selectAction.push(args);
        if (ele && !syntheticEvent) {
            // Select state will be toggled after click events
            ele.unselect();
        }
    }
    public attach(cy: Cy.Core) {
        this.detach();
        this.cy = cy;
        this.selectAction.attach(cy);
    }
    public detach() {
        this.selectAction.detach();
        this.cy = undefined;
    }
}
const highlighted = new GraphHighlights();

export function registerInfoPane(
    cy: Cy.Core,
    startSelect: string,
) {
    highlighted.attach(cy);
    cy.on("click", onClick);

    if (startSelect) {
        const node = getNodes(cy.nodes(), (n) => n.id() === startSelect);
        // tslint:disable-next-line:no-any
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
function onClick(e: Cy.EventObject, syntheticEvent?: boolean) {
    const target: Cy.CollectionElements = e.target;

    if (
        target.id && highlighted.getSelectedId() !== target.id()
    ) {
        highlighted.select(target, syntheticEvent);
    } else {
        highlighted.select(undefined);
    }
    return;
}

let curr: Cy.CollectionElements | null = null;
function showInfo(target: Cy.CollectionElements) {
    if (!curr || curr.id() !== target.id()) {
        if (curr) {
            curr.off("style");
        }
        target.on("style",
            () => {
                showInfo(target);
            },
        );
        curr = target;
    }
    if (target.isNode()) {
        const node = target as Cy.NodeCollection;
        showNode(node);
    } else if (target.isEdge()) {
        const edge = target as Cy.EdgeCollection;
        showEdge(edge);
    }
}

function hideInfo() {
    infoElement.innerHTML = "";
    if (curr) {
        curr.off("style");
        curr = null;
    }
}
function showEdge(edge: Cy.EdgeCollection) {
    ReactDom.render(<EdgeInfo edge={edge} />, infoElement);
}
class NodeLink extends React.Component<{node: Cy.NodeCollection}, {}> {
    public render() {
        return <a href="#"
            onClick={() => this.selectNode()}
            title={this.props.node.id()}
            onKeyDown={(e) => {
                if (e.keyCode === 32) {
                    this.selectNode();
                }
            }}
        >
            {this.props.node.data("name")}
        </a>;
    }
    private selectNode() {
        // tslint:disable-next-line:no-any
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
        return <a
            className="line"
            onClick={() => this.focusLine()}
            onKeyDown={(e) => {
                if (e.keyCode === 32) {
                    this.focusLine();
                }
            }}
            href="#"
        >
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
            <button className={`name ${node.hasClass("hidden") ? "hidden" : ""}`}
                role="heading"
                title={getData("id")}
                autoFocus={true}
                onClick={() => {
                    toggleNodeAction.push({id: node.id()});
                }}
            >
                {getData("name")}
            </button>
            <button
                className={`type ${node.hasClass("hidden-type") ? "hidden" : ""}`}
                onClick={() => {
                    toggleTypeAction.push({type: getData("type")});
                }}
            >
                {getData("type")}
            </button>
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
