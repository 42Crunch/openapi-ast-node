import { parseYaml } from "../src";

describe("Parsing of custom YAML Tags", () => {
  it("should fail on unknown tags", () => {
    const [root, errors] = parseYaml("foo: !bar baz");

    expect(errors).toEqual([
      {
        message: "JS-YAML: unknown tag <!bar> at line 1, column 6",
        offset: 5,
      },
    ]);
  });

  it("should allow specifying scalarcustom tags", () => {
    const [root, errors] = parseYaml("foo: !bar baz", { "!bar": "scalar" });
    expect(errors).toEqual([]);
  });

  it("should allow specifying sequence custom tags", () => {
    const [root, errors] = parseYaml("foo: !bar [1,2,3]", { "!bar": "sequence" });
    expect(errors).toEqual([]);
  });

  it("should allow specifying mapping custom tags", () => {
    const [root, errors] = parseYaml("foo: !bar {foo: bar}", { "!bar": "mapping" });
    expect(errors).toEqual([]);
  });
});
