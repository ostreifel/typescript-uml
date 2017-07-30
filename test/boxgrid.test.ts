//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { ISuiteCallbackContext, ITestCallbackContext } from "mocha";
import { BoxGridLayout, INodeHierarchy } from "../src/view/Layouts";
// import { BoxGridLayout } from "../src/view/layouts";
// import * as cytoscape from "../node_modules/cytoscape/dist/cytoscape";

// Defines a Mocha test suite to group tests of similar kind together
suite("layout tests", function(this: ISuiteCallbackContext) {

    const layout = new BoxGridLayout(null);
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
});
