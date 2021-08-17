import { replace } from "../lib";

describe("Replace tests", () => {
  it("yaml replace value", async () => {
    expect(`foo: baz`).toEqual(replace("foo: bar", "yaml", [{ pointer: "/foo", value: "baz" }]));
  });

  it("yaml replace quoted value", async () => {
    expect(`foo: "baz"`).toEqual(
      replace(`foo: "bar"`, "yaml", [{ pointer: "/foo", value: "baz" }])
    );
    expect(`foo: 'baz'`).toEqual(
      replace(`foo: 'bar'`, "yaml", [{ pointer: "/foo", value: "baz" }])
    );
  });

  it("yaml replace unquoted value", async () => {
    expect(`foo: true`).toEqual(
      replace(`foo: false`, "yaml", [{ pointer: "/foo", value: "true" }])
    );
    expect(`foo: 123`).toEqual(replace(`foo: 321`, "yaml", [{ pointer: "/foo", value: "123" }]));
  });

  it("yaml replace value, multiple replacements", async () => {
    expect(`boom: baz`).toEqual(
      replace("foo: bar", "yaml", [
        { pointer: "/foo", value: "baz" },
        { pointer: "/foo", value: "boom", replaceKey: true },
      ])
    );
  });

  it("yaml replace value, flow", async () => {
    expect(`foo: {"bar": "boom"}`).toEqual(
      replace(`foo: {"bar": "baz"}`, "yaml", [{ pointer: "/foo/bar", value: "boom" }])
    );
  });

  it("yaml replace value, flow, array", async () => {
    const yaml = `foo: ["bar", "baz"]`;
    expect(`foo: ["boom", "baz"]`).toEqual(
      replace(yaml, "yaml", [{ pointer: "/foo/0", value: "boom" }])
    );
    expect(`foo: ["bar", "boom"]`).toEqual(
      replace(yaml, "yaml", [{ pointer: "/foo/1", value: "boom" }])
    );
  });

  it("yaml replace key", async () => {
    expect(`baz: bar`).toEqual(
      replace("foo: bar", "yaml", [{ pointer: "/foo", value: "baz", replaceKey: true }])
    );
  });

  it("yaml replace quoted key", async () => {
    expect(`"300": bar`).toEqual(
      replace('"200": bar', "yaml", [{ pointer: "/200", value: "300", replaceKey: true }])
    );
  });

  it("yaml replace key, flow", async () => {
    const yaml = `foo: {"bar": "baz"}`;
    expect(`foo: {"boom": "baz"}`).toEqual(
      replace(yaml, "yaml", [{ pointer: "/foo/bar", value: "boom", replaceKey: true }])
    );
  });

  it("yaml replace value in array", async () => {
    const yaml = `
foo: one
bar:
  - one
  - two
baz: three`;

    expect(
      `
foo: one
bar:
  - one
  - baz
baz: three`
    ).toEqual(replace(yaml, "yaml", [{ pointer: "/bar/1", value: "baz" }]));

    expect(
      `
foo: one
bar:
  - baz
  - two
baz: three`
    ).toEqual(replace(yaml, "yaml", [{ pointer: "/bar/0", value: "baz" }]));
  });

  it("json replace value", async () => {
    expect('{"foo": "baz"}').toEqual(
      replace('{"foo": "bar"}', "json", [{ pointer: "/foo", value: "baz" }])
    );
  });

  it("json replace unqoted value", async () => {
    expect('{"foo": true}').toEqual(
      replace('{"foo": false}', "json", [{ pointer: "/foo", value: "true" }])
    );
    expect('{"foo": 123}').toEqual(
      replace('{"foo": 321}', "json", [{ pointer: "/foo", value: "123" }])
    );
  });

  it("json replace value, multiple replacements", async () => {
    expect('{"boom": "baz"}').toEqual(
      replace('{"foo": "bar"}', "json", [
        { pointer: "/foo", value: "baz" },
        { pointer: "/foo", value: "boom", replaceKey: true },
      ])
    );
  });

  it("json replace value in array", async () => {
    expect('{"foo": ["boom", "baz"]}').toEqual(
      replace('{"foo": ["bar", "baz"]}', "json", [{ pointer: "/foo/0", value: "boom" }])
    );
    expect('{"foo": ["bar", "boom"]}').toEqual(
      replace('{"foo": ["bar", "baz"]}', "json", [{ pointer: "/foo/1", value: "boom" }])
    );
  });

  it("json replace key", async () => {
    expect('{"baz": "bar"}').toEqual(
      replace('{"foo": "bar"}', "json", [{ pointer: "/foo", value: "baz", replaceKey: true }])
    );
    expect('{"foo": {"baz": "baz"}}').toEqual(
      replace('{"foo": {"bar": "baz"}}', "json", [
        { pointer: "/foo/bar", value: "baz", replaceKey: true },
      ])
    );
  });
});
