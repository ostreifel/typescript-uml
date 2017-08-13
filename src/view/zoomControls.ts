export class ZoomControls {
    private cy?: Cy.Core;
    constructor() {
        const rate = .001;
        this.registerZoom(1 - rate, 189 /* dash */);
        this.registerZoom(1 + rate, 187 /* equal sign */);
    }
    public registerCy(cy: Cy.Core) {
        this.cy = cy;
    }
    private registerZoom(factor: number, keyCode: number) {
        let zoomTimer: NodeJS.Timer | null;
        let lastZoom = 0;
        const zoom = () => {
            if (this.cy) {
                const now = Date.now();
                const msElapsed = lastZoom ? now - lastZoom : 1;
                lastZoom = now;
                const currZoom = this.cy.zoom();
                const level = Math.pow(factor, msElapsed) * currZoom;
                const zoomOptions = {
                    level,
                    renderedPosition: {
                        x: this.cy.width() / 2,
                        y: this.cy.height() / 2,
                    },
                } as Cy.ZoomOptions;
                this.cy.zoom(zoomOptions);
            }
        };
        $("body").keydown((e) => {
            if (
                this.cy &&
                !zoomTimer &&
                !e.altKey && !e.shiftKey &&
                e.ctrlKey && e.keyCode === keyCode
            ) {
                zoomTimer = setInterval(zoom, 1);
            }
        }).keyup((e) => {
            if (
                zoomTimer &&
                e.keyCode === keyCode
            ) {
                clearInterval(zoomTimer);
                lastZoom = 0;
                zoomTimer = null;
            }
        });
    }
}

export const zoomControls = new ZoomControls();
