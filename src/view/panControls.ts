
import { KeyCodes } from "office-ui-fabric-react/lib/Utilities";

class PanControls {
    /** Pixels/ms */
    private static readonly MOVE_RATE = 1;
    /** Maximum frame refresh when panning */
    private static readonly MOVE_INTERVAL = 1;
    private cy?: Cy.Core;
    constructor() {
        // register html elements here;
        this.registerControl(
            {
                x: 0,
                y: PanControls.MOVE_RATE,
            },
            $(".mouse-pan.top"),
            KeyCodes.up,
        );
        this.registerControl(
            {
                x: 0,
                y: -PanControls.MOVE_RATE,
            },
            $(".mouse-pan.bottom"),
            KeyCodes.down,
        );
        this.registerControl(
            {
                x: -PanControls.MOVE_RATE,
                y: 0,
            },
            $(".mouse-pan.right"),
            KeyCodes.right,
        );
        this.registerControl(
            {
                x: PanControls.MOVE_RATE,
                y: 0,
            },
            $(".mouse-pan.left"),
            KeyCodes.left,
        );

        this.registerControl(
            {
                x: PanControls.MOVE_RATE,
                y: PanControls.MOVE_RATE,
            },
            $(".mouse-pan.top-left"),
        );
        this.registerControl(
            {
                x: -PanControls.MOVE_RATE,
                y: -PanControls.MOVE_RATE,
            },
            $(".mouse-pan.bottom-right"),
        );
        this.registerControl(
            {
                x: PanControls.MOVE_RATE,
                y: -PanControls.MOVE_RATE,
            },
            $(".mouse-pan.bottom-left"),
        );
    }
    public register(cy: Cy.Core) {
        this.cy = cy;
    }
    private registerControl({x: xRate, y: yRate}: Cy.Position, mouseElement: JQuery, keyCode?: number) {
        let lastMove = 0;
        const pan = () => {
            if (this.cy) {
                const now = Date.now();
                const msElapsed = lastMove ? now - lastMove : 1;
                lastMove = now;
                const delta: Cy.Position = {
                    x: xRate * msElapsed,
                    y: yRate * msElapsed,
                };
                this.cy.panBy(delta);
            }
        };

        // let mouseTimer: NodeJS.Timer | null;
        mouseElement.mouseenter(() => {
            // mouseTimer = setInterval(pan, PanControls.MOVE_INTERVAL);
        });
        mouseElement.mouseleave(() => {
            // if (mouseTimer) {
            //     clearInterval(mouseTimer);
            //     mouseTimer = null;
            //     lastMove = 0;
            // }
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
            }).keyup((e) => {
                if (
                    keyTimer &&
                    !e.altKey && !e.shiftKey && !e.ctrlKey && e.keyCode === keyCode
                ) {
                    clearInterval(keyTimer);
                    keyTimer = null;
                    lastMove = 0;
                }
            });
        }
    }
}

export const panControls = new PanControls();
