//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { ISuiteCallbackContext, ITestCallbackContext } from "mocha";
import * as path from "path";
import * as ts from "typescript";
import * as vscode from "vscode";
import { NodeReferenceWalker } from "../src/diagram/NodeReferenceWalker";

// Defines a Mocha test suite to group tests of similar kind together
suite("Walker tests", function(this: ISuiteCallbackContext) {
    const testDataPath = path.join(path.dirname(this["file"]), "..", "..", "test", "testData");

    function compile(fileName) {
        const filePath = path.join(testDataPath, fileName);
        const program = ts.createProgram([filePath], {});
        const sourceFile = program.getSourceFile(filePath);
        const typechecker = program.getTypeChecker();
        return {
            sourceFile,
            typechecker,
        };
    }

    test("namespace", function(this: ITestCallbackContext) {
        const { sourceFile, typechecker } = compile("namespace.ts");
        const walker = new NodeReferenceWalker(sourceFile, typechecker);
        walker.walk(sourceFile);
        const { graphNodes } = walker;
        assert.equal(1, graphNodes.length);
    });
});
