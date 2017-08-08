import * as assert from "assert";

import { ISuiteCallbackContext, ITestCallbackContext } from "mocha";
import { BoxGridLayout, INodeHierarchy } from "../src/view/Layouts";

suite("layout tests", function(this: ISuiteCallbackContext) {

    // tslint:disable-next-line:no-any
    const layout = new BoxGridLayout(null as any);
    const getGrid = (nodes: INodeHierarchy) => layout["calcPosGrid"](nodes);
    test("sanity check", function(this: ITestCallbackContext) {
        const nodes: INodeHierarchy = {
            directIds: ["1", "2", "3", "4"],
            groups: [],
        };
        const grid = getGrid(nodes);
        assert.deepEqual(
            [
                ["1", "2"],
                ["3", "4"],
            ],
            grid,
        );
    });
    test("2 levels", function(this: ITestCallbackContext) {
        const nodes: INodeHierarchy = {
            directIds: ["1", "2"],
            groups: [
                {directIds: ["3"], groups: []},
                {directIds: ["4"], groups: []},
            ],
        };
        const grid = getGrid(nodes);
        assert.deepEqual(
            [
                ["1", "3"],
                ["2", "4"],
            ],
            grid,
        );
    });
    test("imperfect square", function(this: ITestCallbackContext) {
        const nodes: INodeHierarchy = {
            // just so that the main window is 3 by 3
            directIds: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
            groups: [
                {directIds: ["a", "b", "c"], groups: []},
                {directIds: ["d"], groups: []},
                {directIds: ["e"], groups: []},
                {directIds: ["f"], groups: []},
            ],
        };
        const grid = getGrid(nodes);
        assert.deepEqual(
            [
                ["1", "2", "3", ""],
                ["4", "5", "6", ""],
                ["7", "8", "9", ""],
                ["a", "b", "d", "e"],
                ["c",  "" , "f", ""],
            ],
            grid,
        );
    });
});
