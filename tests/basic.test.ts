import { parseJson, parseYaml } from "../src";
import { readFileSync } from "fs";

function loadJson(filename) {
  return parseJson(readFileSync(filename, { encoding: "utf8" }));
}

function loadYaml(filename) {
  return parseYaml(readFileSync(filename, { encoding: "utf8" }));
}

function wrap(text) {
  return text.replace(new RegExp("\r\n", "g"), "\n");
}

describe("Basic tests", () => {
  it("finds nodes, top level, yaml", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    const swagger = root.find("/swagger");
    expect(swagger.getValue()).toEqual("2.0");
    expect(swagger.getKey()).toEqual("swagger");

    const host = root.find("/host");
    expect(host.getValue()).toEqual("xkcd.com");
    expect(host.getKey()).toEqual("host");
  });

  it("finds nodes, top level, json", async () => {
    const [root] = loadJson("tests/xkcd.json");

    const swagger = root.find("/swagger");
    expect(swagger.getValue()).toEqual("2.0");
    expect(swagger.getKey()).toEqual("swagger");

    const host = root.find("/host");
    expect(host.getValue()).toEqual("xkcd.com");
    expect(host.getKey()).toEqual("host");
  });

  it("gets json children", async () => {
    const [root] = loadJson("tests/xkcd.json");

    const paths = root.find("/paths");
    const children = paths.getChildren();
    expect(children.length).toEqual(2);
    expect(children[0].getKey()).toEqual("/info.0.json");
    expect(children[1].getKey()).toEqual("/{comicId}/info.0.json");
  });

  it("gets yaml children", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    const paths = root.find("/paths");
    const children = paths.getChildren();
    expect(children.length).toEqual(2);
    expect(children[0].getKey()).toEqual("/info.0.json");
    expect(children[1].getKey()).toEqual("/{comicId}/info.0.json");
  });

  it("gets json children array", async () => {
    const [root] = loadJson("tests/xkcd.json");

    const schemes = root.find("/schemes");
    const children = schemes.getChildren();
    expect(children.length).toEqual(2);
    expect(children[0].getKey()).toEqual("0");
    expect(children[0].getValue()).toEqual("http");
    expect(children[1].getKey()).toEqual("1");
    expect(children[1].getValue()).toEqual("https");
  });

  it("gets yaml children array", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    const schemes = root.find("/schemes");
    const children = schemes.getChildren();
    expect(children.length).toEqual(2);
    expect(children[0].getKey()).toEqual("0");
    expect(children[0].getValue()).toEqual("http");
    expect(children[1].getKey()).toEqual("1");
    expect(children[1].getValue()).toEqual("https");
  });

  it("finds nodes, multiple levels, json", async () => {
    const [root] = loadJson("tests/xkcd.json");

    const title = root.find("/info/title");
    expect(title.getValue()).toEqual("XKCD");

    const description = root.find("/paths/~1info.0.json/get/description");
    expect(description.getValue()).toEqual("Fetch current comic and metadata.\n");
  });

  it("finds nodes, multiple levels, json", async () => {
    const [root] = loadJson("tests/xkcd.json");

    const title = root.find("/info/title");
    expect(title.getValue()).toEqual("XKCD");

    const description = root.find("/paths/~1info.0.json/get/description");
    expect(description.getValue()).toEqual("Fetch current comic and metadata.\n");
  });

  it("finds nodes, multiple levels, yaml", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    const title = root.find("/info/title");
    expect(title.getValue()).toEqual("XKCD");

    const description = root.find("/paths/~1info.0.json/get/description");
    expect(description.getValue()).toEqual("Fetch current comic and metadata.\n");
  });

  it("json node depth", async () => {
    const [root] = loadJson("tests/xkcd.json");

    const info = root.find("/info");
    const title = root.find("/info/title");
    const description = root.find("/paths/~1info.0.json/get/description");
    const http = root.find("/schemes/0");

    expect(root.getDepth()).toEqual(0);
    expect(info.getDepth()).toEqual(1);
    expect(title.getDepth()).toEqual(2);
    expect(http.getDepth()).toEqual(2);
    expect(description.getDepth()).toEqual(4);
  });

  it("yaml node depth", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    const info = root.find("/info");
    const title = root.find("/info/title");
    const description = root.find("/paths/~1info.0.json/get/description");
    const http = root.find("/schemes/0");

    expect(root.getDepth()).toEqual(0);
    expect(info.getDepth()).toEqual(1);
    expect(title.getDepth()).toEqual(2);
    expect(http.getDepth()).toEqual(2);
    expect(description.getDepth()).toEqual(4);
  });

  it("json path and v3 petstore json", async () => {
    const [root] = loadJson("tests/petstore-v3.json");

    const schema = root.find("/paths/~1pets/get/parameters/0/schema");
    expect(schema).toBeTruthy();

    const schema2 = root.find("/paths/~1pets/get/responses/200");
    expect(schema2).toBeTruthy();
  });

  it("json path and v3 petstore yaml", async () => {
    const [root] = loadYaml("tests/petstore-v3.yaml");

    const schema = root.find("/paths/~1pets/get/parameters/0/schema");
    expect(schema).toBeTruthy();

    const schema2 = root.find("/paths/~1pets/get/responses/200");
    expect(schema2).toBeTruthy();
  });

  it("slash escape in json", async () => {
    const [root] = loadJson("tests/petstore-v3.json");

    const schema = root.find("/paths/~1pets/get/responses/200/content/application~1json/schema");
    expect(schema).toBeTruthy();
  });

  it("slash escape in yaml", async () => {
    const [root] = loadYaml("tests/petstore-v3.yaml");

    const schema = root.find("/paths/~1pets/get/responses/200/content/application~1json/schema");
    expect(schema).toBeTruthy();
  });

  it("yaml node getKey()", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    const responses = root.find("/paths/~1{comicId}~1info.0.json/get/parameters");
    const children = responses.getChildren();
    expect(children.length).toEqual(1);
    expect(children[0].getKey()).toEqual("0");
  });

  it("json node getKey()", async () => {
    const [root] = loadJson("tests/xkcd.json");

    const responses = root.find("/paths/~1{comicId}~1info.0.json/get/parameters");
    const children = responses.getChildren();
    expect(children.length).toEqual(1);
    expect(children[0].getKey()).toEqual("0");
  });

  it("json nodes getParent()", async () => {
    const [root] = parseJson(`{"foo": [1,2], "bar": {"baz": true}}`);

    const foo = root.find("/foo");
    const foo0 = root.find("/foo/0");
    const foo1 = root.find("/foo/1");
    const baz = root.find("/bar/baz");
    expect(foo.getKey()).toEqual("foo");
    expect(foo0.getKey()).toEqual("0");
    expect(foo1.getKey()).toEqual("1");
    expect(baz.getKey()).toEqual("baz");

    expect(foo0.getParent().getKey()).toEqual("foo");
    expect(foo1.getParent().getKey()).toEqual("foo");
    expect(baz.getParent().getKey()).toEqual("bar");
  });

  it("yaml nodes getParent()", async () => {
    const [root] = parseYaml(`
foo:
  - 1
  - 2
bar:
  baz: true`);

    const foo = root.find("/foo");
    const foo0 = root.find("/foo/0");
    const foo1 = root.find("/foo/1");
    const baz = root.find("/bar/baz");
    expect(foo.getKey()).toEqual("foo");
    expect(foo0.getKey()).toEqual("0");
    expect(foo1.getKey()).toEqual("1");
    expect(baz.getKey()).toEqual("baz");

    expect(foo0.getParent().getKey()).toEqual("foo");
    expect(foo1.getParent().getKey()).toEqual("foo");
    expect(baz.getParent().getKey()).toEqual("bar");
  });

  it("json top level list", async () => {
    const [root] = parseJson(`[1,2]`);
    const top = root.find("");
    const one = root.find("/0");
    const two = root.find("/1");
    expect(top).toBeTruthy();
    expect(top.getChildren().length).toEqual(2);
    expect(one.getValue()).toEqual(1);
    expect(one.getValue()).toEqual(1);
    expect(two.getValue()).toEqual(2);
  });

  it("yaml top level list", async () => {
    const [root] = parseYaml(`
- 1
- 2`);

    const top = root.find("");
    const one = root.find("/0");
    const two = root.find("/1");
    expect(top).toBeTruthy();
    expect(one.getValue()).toEqual("1");
    expect(two.getValue()).toEqual("2");
  });

  it("yaml findNodeAtOffset() top level array", async () => {
    const text = "- a: b\n- c: d";
    const [root] = parseYaml(text);

    expect(text.length).toEqual(13);
    expect(root.findNodeAtOffset(12).getKey()).toEqual("c");
    expect(root.findNodeAtOffset(11).getKey()).toEqual("c");
    expect(root.findNodeAtOffset(10).getKey()).toEqual("c");
    expect(root.findNodeAtOffset(9).getKey()).toEqual("c");
    expect(root.findNodeAtOffset(8).getKey()).toEqual(undefined);
    expect(root.findNodeAtOffset(7).getKey()).toEqual(undefined);
    expect(root.findNodeAtOffset(6).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(5).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(4).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(3).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(2).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(1).getKey()).toEqual(undefined);
    expect(root.findNodeAtOffset(0).getKey()).toEqual(undefined);
  });

  it("yaml findNodeAtOffset() top level object", async () => {
    const text = "a:\n - b: c";
    const [root] = parseYaml(text);

    expect(text.length).toEqual(10);
    expect(root.findNodeAtOffset(9).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(9).getValue()).toEqual("c");
    expect(root.findNodeAtOffset(8).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(7).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(6).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(5).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(4).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(3).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(2).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(1).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(0).getKey()).toEqual("a");
  });

  it("yaml findNodeAtOffset() broken yaml", async () => {
    const text = "a:\n - b:";
    const [root] = parseYaml(text);

    expect(text.length).toEqual(8);
    expect(root.findNodeAtOffset(8).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(7).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(6).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(5).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(4).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(3).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(2).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(1).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(0).getKey()).toEqual("a");
  });

  it("yaml findNodeAtOffset() broken yaml, more spaces", async () => {
    const text = "a:\n  b:   ";
    const [root] = parseYaml(text);

    expect(text.length).toEqual(10);
    expect(root.findNodeAtOffset(9).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(8).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(7).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(6).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(5).getKey()).toEqual("b");
    expect(root.findNodeAtOffset(4).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(3).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(2).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(1).getKey()).toEqual("a");
    expect(root.findNodeAtOffset(0).getKey()).toEqual("a");
  });

  it("json getJsonPointer()", async () => {
    const [root] = parseJson(`{"foo": [1,2], "bar": {"baz": true}, "ra/ro": true}`);
    expect(root.find("").getJsonPonter()).toEqual("");
    expect(root.find("/foo").getJsonPonter()).toEqual("/foo");
    expect(root.find("/foo/0").getJsonPonter()).toEqual("/foo/0");
    expect(root.find("/foo/1").getJsonPonter()).toEqual("/foo/1");
    expect(root.find("/bar/baz").getJsonPonter()).toEqual("/bar/baz");
    expect(root.find("/ra~1ro").getJsonPonter()).toEqual("/ra~1ro");
  });

  it("yaml getJsonPointer()", async () => {
    const [root] = parseYaml(`
foo:
  - 1
  - 2
bar:
  baz: true
ra/ro: true`);

    expect(root.find("").getJsonPonter()).toEqual("");
    expect(root.find("/foo").getJsonPonter()).toEqual("/foo");
    expect(root.find("/foo/0").getJsonPonter()).toEqual("/foo/0");
    expect(root.find("/foo/1").getJsonPonter()).toEqual("/foo/1");
    expect(root.find("/bar/baz").getJsonPonter()).toEqual("/bar/baz");
    expect(root.find("/ra~1ro").getJsonPonter()).toEqual("/ra~1ro");
  });

  it("json prev()", async () => {
    const [root] = loadJson("tests/xkcd.json");

    const target = root.find("/swagger");
    expect(target.prev()).toEqual(undefined);
    expect(target.next().getJsonPonter()).toEqual("/schemes");
    expect(target.next().prev().getJsonPonter()).toEqual("/swagger");

    const target2 = root.find("/schemes/0");
    expect(target2.prev()).toEqual(undefined);
    expect(target2.next().getJsonPonter()).toEqual("/schemes/1");
  });

  it("json next()", async () => {
    const [root] = loadJson("tests/xkcd.json");

    const target = root.find("/definitions");
    expect(target.next()).toEqual(undefined);
    expect(target.prev().getJsonPonter()).toEqual("/paths");
    expect(target.prev().next().getJsonPonter()).toEqual("/definitions");

    const target2 = root.find("/schemes/1");
    expect(target2.next()).toEqual(undefined);
    expect(target2.prev().getJsonPonter()).toEqual("/schemes/0");
  });

  it("json isArray()", async () => {
    const [root] = loadJson("tests/xkcd.json");

    expect(root.find("/schemes").isArray()).toEqual(true);
    expect(root.find("/schemes/0").isArray()).toEqual(false);
    expect(root.find("/host").isArray()).toEqual(false);
    expect(root.find("/info").isArray()).toEqual(false);
  });

  it("json isObject()", async () => {
    const [root] = loadJson("tests/xkcd.json");

    expect(root.find("/schemes").isObject()).toEqual(false);
    expect(root.find("/schemes/0").isObject()).toEqual(false);
    expect(root.find("/host").isObject()).toEqual(false);
    expect(root.find("/info").isObject()).toEqual(true);
  });

  it("json getKeyRange()", async () => {
    const text = readFileSync("tests/xhr.json", { encoding: "utf8" });
    const [root] = parseJson(text);

    let range = root.find("/info/license/name").getKeyRange();
    expect(text.substring(range[0], range[1])).toEqual("name");

    range = root.find("/servers/1/url").getKeyRange();
    expect(text.substring(range[0], range[1])).toEqual("url");

    range = root.find("/paths/~1posts/get/responses/200").getKeyRange();
    expect(text.substring(range[0], range[1])).toEqual("200");

    expect(root.find("/servers/1").getKeyRange()).toEqual(undefined);
  });

  it("json getValueRange()", async () => {
    const text = readFileSync("tests/xhr.json", { encoding: "utf8" });
    const [root] = parseJson(text);

    let range = root.find("/info/license/name").getValueRange();
    expect(text.substring(range[0], range[1])).toEqual('"MIT"');

    range = root.find("/servers/1/url").getValueRange();
    expect(text.substring(range[0], range[1])).toEqual('"https://jsonplaceholder.typicode.com"');

    range = root.find("/paths/~1posts/get/responses/200").getValueRange();
    expect(wrap(text.substring(range[0], range[1]))).toEqual(
      '{\n            "description": "OK"\n          }'
    );

    range = root.find("/servers/1").getValueRange();
    expect(wrap(text.substring(range[0], range[1]))).toEqual(
      '{\n      "url": "https://jsonplaceholder.typicode.com"\n    }'
    );
  });

  it("yaml prev()", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    const target = root.find("/swagger");
    expect(target.prev()).toEqual(undefined);
    expect(target.next().getJsonPonter()).toEqual("/schemes");
    expect(target.next().prev().getJsonPonter()).toEqual("/swagger");

    const target2 = root.find("/schemes/0");
    expect(target2.prev()).toEqual(undefined);
    expect(target2.next().getJsonPonter()).toEqual("/schemes/1");
  });

  it("yaml next()", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    const target = root.find("/definitions");
    expect(target.next()).toEqual(undefined);
    expect(target.prev().getJsonPonter()).toEqual("/paths");
    expect(target.prev().next().getJsonPonter()).toEqual("/definitions");

    const target2 = root.find("/schemes/1");
    expect(target2.next()).toEqual(undefined);
    expect(target2.prev().getJsonPonter()).toEqual("/schemes/0");
  });

  it("yaml isArray()", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    expect(root.find("/schemes").isArray()).toEqual(true);
    expect(root.find("/schemes/0").isArray()).toEqual(false);
    expect(root.find("/host").isArray()).toEqual(false);
    expect(root.find("/info").isArray()).toEqual(false);
  });

  it("yaml isObject()", async () => {
    const [root] = loadYaml("tests/xkcd.yaml");

    expect(root.find("/schemes").isObject()).toEqual(false);
    expect(root.find("/schemes/0").isObject()).toEqual(false);
    expect(root.find("/host").isObject()).toEqual(false);
    expect(root.find("/info").isObject()).toEqual(true);
  });

  it("yaml getKeyRange()", async () => {
    const text = readFileSync("tests/xkcd.yaml", { encoding: "utf8" });
    const [root] = parseYaml(text);

    let range = root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/responses/200").getKeyRange();
    expect(text.substring(range[0], range[1])).toEqual("'200'");

    range = root.find("/info/x-tags").getKeyRange();
    expect(text.substring(range[0], range[1])).toEqual("x-tags");

    range = root
      .find("/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0/required")
      .getKeyRange();
    expect(text.substring(range[0], range[1])).toEqual("required");

    expect(root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0").getKeyRange()).toEqual(
      undefined
    );
  });

  it("yaml getValueRange()", async () => {
    const text = readFileSync("tests/xkcd.yaml", { encoding: "utf8" });
    const [root] = parseYaml(text);

    let range = root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/responses/200").getValueRange();
    expect(wrap(text.substring(range[0], range[1]))).toEqual(
      "description: OK\n          schema:\n            $ref: '#/definitions/comic'"
    );

    range = root.find("/info/x-tags").getValueRange();
    expect(wrap(text.substring(range[0], range[1]))).toEqual("- humor\n    - comics\n  ");

    range = root
      .find("/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0/required")
      .getValueRange();
    expect(wrap(text.substring(range[0], range[1]))).toEqual("true");

    range = root.find("/paths/~1%7BcomicId%7D~1info.0.json/get/parameters/0").getValueRange();
    expect(wrap(text.substring(range[0], range[1]))).toEqual(
      "in: path\n          name: comicId\n          required: true\n          type: number"
    );
  });

  it("fails on duplicate keys", async () => {
    const [node, errors] = parseJson('{"foo": 1, "foo": 2}');
    expect(errors[0]).toEqual({ message: "DuplicateKey", offset: 1, length: 5 });
    expect(errors[1]).toEqual({ message: "DuplicateKey", offset: 11, length: 5 });
  });
});
