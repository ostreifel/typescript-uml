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
import { computeDiagramForFile } from "../src/diagram/computeDiagram";
import { IDiagramNode } from "../src/diagram/DiagramModel";
import { NodeReferenceWalker } from "../src/diagram/NodeReferenceWalker";

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension tests", function(this: ISuiteCallbackContext) {
    const testDataPath = path.join(path.dirname(this["file"]), "..", "..", "test", "testData");
    function toFilePath(fileName: string) {
        return path.join(testDataPath, fileName);
    }

    function compile(fileName) {
        const filePath = toFilePath(fileName);
        const program = ts.createProgram([filePath], {});
        const sourceFile = program.getSourceFile(filePath);
        const typechecker = program.getTypeChecker();
        return {
            sourceFile,
            typechecker,
        };
    }

    test("namespace walker nodes", function(this: ITestCallbackContext) {
        const { sourceFile } = compile("namespace.ts");
        const walker = new NodeReferenceWalker(sourceFile);
        walker.walk(sourceFile);
        const idents = walker.graphNodes.map((n) => n.symbol.getName());
        assert.deepEqual(["TestNamespace", "moduleVariable", "moduleFunction"], idents);
    });

    test("namespace graph nodes", function(this: ITestCallbackContext) {
        const filePath = toFilePath("namespace.ts");
        const diagram = computeDiagramForFile(filePath);
        const nodes = diagram.filter((e) => (e as IDiagramNode).data.name) as IDiagramNode[];
        const nodeNames = nodes.map((n) => n.data.name);
        assert.deepEqual(["TestNamespace", "moduleVariable", "moduleFunction"], nodeNames);
    });

    test("namespace inheritance", function(this: ITestCallbackContext) {
        const filePath = toFilePath("namespace.ts");
        const diagram = computeDiagramForFile(filePath);
        const nodes = diagram.filter((e) => (e as IDiagramNode).data.parent) as IDiagramNode[];
        const nodeNames = nodes.map((n) => n.data.name);
        assert.deepEqual(["moduleVariable", "moduleFunction"], nodeNames);
    });
});
