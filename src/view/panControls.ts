
import { KeyCodes } from "office-ui-fabric-react/lib/Utilities";

class PanControls {
    private static readonly MOVE_DISTANCE = 1;
    private static readonly MOVE_INTERVAL = 3;
    private cy?: Cy.Core;
    constructor() {
        // register html elements here;
        this.registerControl(
            {
                x: 0,
                y: PanControls.MOVE_DISTANCE,
            },
            $(".mouse-pan.top"),
            KeyCodes.up,
        );
        this.registerControl(
            {
                x: 0,
                y: -PanControls.MOVE_DISTANCE,
            },
            $(".mouse-pan.bottom"),
            KeyCodes.down,
        );
        this.registerControl(
            {
                x: -PanControls.MOVE_DISTANCE,
                y: 0,
            },
            $(".mouse-pan.right"),
            KeyCodes.right,
        );
        this.registerControl(
            {
                x: PanControls.MOVE_DISTANCE,
                y: 0,
            },
            $(".mouse-pan.left"),
            KeyCodes.left,
        );

        this.registerControl(
            {
                x: PanControls.MOVE_DISTANCE,
                y: PanControls.MOVE_DISTANCE,
            },
            $(".mouse-pan.top-left"),
        );
        this.registerControl(
            {
                x: -PanControls.MOVE_DISTANCE,
                y: -PanControls.MOVE_DISTANCE,
            },
            $(".mouse-pan.bottom-right"),
        );
        this.registerControl(
            {
                x: PanControls.MOVE_DISTANCE,
                y: -PanControls.MOVE_DISTANCE,
            },
            $(".mouse-pan.bottom-left"),
        );
    }
    public register(cy: Cy.Core) {
        this.cy = cy;
    }
    private registerControl(increment: Cy.Position, mouseElement: JQuery, keyCode?: number) {
        let mouseTimer: NodeJS.Timer;
        const pan = () => {
            if (this.cy) {
                this.cy.panBy(increment);
            }
        };
        mouseElement.mouseenter(() => {
            mouseTimer = setInterval(pan, PanControls.MOVE_INTERVAL);
        });
        mouseElement.mouseleave(() => {
            if (mouseTimer) {
                clearInterval(mouseTimer);
            }
        });
        if (keyCode) {
            let keyTimer: NodeJS.Timer | null;
            $("body").keydown((e) => {
                if (
                    !keyTimer &&
                    !e.altKey && !e.shiftKey && !e.ctrlKey && e.keyCode === keyCode &&
                    e.target.tagName !== "INPUT"
                ) {
                    keyTimer = setInterval(pan, PanControls.MOVE_INTERVAL);
                }
            });
            $("body").keyup((e) => {
                if (
                    keyTimer &&
                    !e.altKey && !e.shiftKey && !e.ctrlKey && e.keyCode === keyCode
                ) {
                    clearInterval(keyTimer);
                    keyTimer = null;
                }
            });
        }
    }
}

export const panControls = new PanControls();
