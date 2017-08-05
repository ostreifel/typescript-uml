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
suite("Parse tests", function(this: ISuiteCallbackContext) {
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
        const diagram = computeDiagramForFile(filePath, () => undefined);
        const nodes = diagram.filter((e) => (e as IDiagramNode).data.name) as IDiagramNode[];
        const nodeNames = nodes.map((n) => n.data.name);
        assert.deepEqual(["TestNamespace", "moduleVariable", "moduleFunction"], nodeNames);
    });

    test("namespace inheritance", function(this: ITestCallbackContext) {
        const filePath = toFilePath("namespace.ts");
        const diagram = computeDiagramForFile(filePath, () => undefined);
        const nodes = diagram.filter((e) => (e as IDiagramNode).data.parent) as IDiagramNode[];
        const nodeNames = nodes.map((n) => n.data.name);
        assert.deepEqual(["moduleVariable", "moduleFunction"], nodeNames);
    });
    test("enum", function(this: ITestCallbackContext) {
        const { sourceFile } = compile("enum.ts");
        const walker = new NodeReferenceWalker(sourceFile);
        walker.walk(sourceFile);
        const idents = walker.graphNodes.map((n) => n.symbol.getName());
        assert.deepEqual(["Enum1", "Member1", "Member2"], idents);
    });
    test("interface", function(this: ITestCallbackContext) {
        const { sourceFile } = compile("interface.ts");
        const walker = new NodeReferenceWalker(sourceFile);
        walker.walk(sourceFile);
        const idents = walker.graphNodes.map((n) => n.symbol.getName());
        assert.deepEqual(["IInterface1", "property1", "property2", "method1"], idents);
    });
    // Sometimes something that should be detected like a function is placed
    // inside something that should not be detected like a variable in a method.
    // In that case the parent should be the first visible node.
    test("nested inheritance", function(this: ITestCallbackContext) {
        const filePath = toFilePath("skipParent.ts");
        const diagram = computeDiagramForFile(filePath, () => undefined) as IDiagramNode[];
        const [child] = diagram.filter((e) => e.data.name && e.data.name === "getValue");
        assert.notEqual(child, undefined, "Could not find child");
        assert.notStrictEqual(child.data.parent, undefined, "parent not found");
        const [, , ...parentIdParts] = child.data.parent ? child.data.parent.split(".") : [];
        assert.deepEqual(parentIdParts, ["function1"]);
    });
    test("type", function(this: ITestCallbackContext) {
        const { sourceFile } = compile("type.ts");
        const walker = new NodeReferenceWalker(sourceFile);
        walker.walk(sourceFile);
        const idents = walker.graphNodes.map((n) => n.symbol.getName());
        assert.deepEqual(["Type1", "prop1", "method1"], idents);
    });
});
