import { parseYaml } from "../src";
import { readFileSync } from "fs";

function loadYaml(filename) {
  return parseYaml(readFileSync(filename, { encoding: "utf8" }));
}

describe("Finding nodes in the yaml with anchors", () => {
  it("finding nodes in the yaml with anchors", async () => {
    const [root] = loadYaml("tests/anchors.yaml");

    // normal node
    expect(root.find("/components/schemas/NewTestObj/properties/name/type").getValue()).toEqual(
      "string"
    );

    // reference
    expect(root.find("/components/schemas/NewTestObj2/properties/name/type").getValue()).toEqual(
      "string"
    );

    // normal node
    expect(root.find("/components/schemas/TestObj/properties/id/format").getValue()).toEqual(
      "uuid"
    );

    // reference merge
    expect(root.find("/components/schemas/TestObj/properties/name/type").getValue()).toEqual(
      "string"
    );
  });
});
