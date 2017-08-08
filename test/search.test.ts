import * as assert from "assert";

import { ISuiteCallbackContext, ITestCallbackContext } from "mocha";
import { searchNodes } from "../src/view/search";

suite("search tests", function(this: ISuiteCallbackContext) {

    function mockArray(names: string[]): Cy.NodeCollection {
        // tslint:disable-next-line:no-any
        return names.map((n) => ({data: () => n})) as any;
    }

    test("sort", function(this: ITestCallbackContext) {
        const nodes = mockArray(["iii", "ii", "i", "ai", "b"]);
        const found = searchNodes(nodes, "i");
        assert.notEqual(found, null);
        if (!found) {
            return;
        }
        const foundNames = found.map((n) => n.data("name"));
        const expectedNames = ["i", "ii", "iii", "ai"];
        assert.deepEqual(foundNames, expectedNames);
    });
});
