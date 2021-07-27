import test from "ava";
import * as json from "jsonc-parser";
import * as yaml from "yaml-language-server-parser";
import { parseJson, parseYaml } from "../lib";

test("AST Json Boundary Test MAX_SAFE_INTEGER", (t) => {

  const text = '{"a": ' + Number.MAX_SAFE_INTEGER + '}';
  const [root, errors] = parseJson(text);
  t.is(root.find("/a").getValue(), Number.MAX_SAFE_INTEGER);
  const [start, end] = root.find("/a").getValueRange();
  t.is(text.substring(start, end), Number.MAX_SAFE_INTEGER.toString());
});

test("AST Yaml Boundary Test MAX_SAFE_INTEGER", (t) => {

  const text = 'a: ' + Number.MAX_SAFE_INTEGER;
  const [root, errors] = parseYaml(text);
  t.is(root.find("/a").getValue(), Number.MAX_SAFE_INTEGER.toString());
  const [start, end] = root.find("/a").getValueRange();
  t.is(text.substring(start, end), Number.MAX_SAFE_INTEGER.toString());
});

test("AST Json Boundary Test > MAX_SAFE_INTEGER", (t) => {

  const text = '{"a": 9223372036854775807}';
  const [root, errors] = parseJson(text);
  t.is(root.find("/a").getValue(), '9223372036854775807');
  const [start, end] = root.find("/a").getValueRange();
  t.is(text.substring(start, end), '9223372036854775807');
});

test("AST Yaml Boundary Test > MAX_SAFE_INTEGER", (t) => {

  const text = 'a: 9223372036854775807';
  const [root, errors] = parseYaml(text);
  t.is(root.find("/a").getValue(), '9223372036854775807');
  const [start, end] = root.find("/a").getValueRange();
  t.is(text.substring(start, end), '9223372036854775807');
});

test("AST Json Boundary Float Point Test", (t) => {

  const text = '{"a": 1.00000}';
  const [root, errors] = parseJson(text);
  t.is(root.find("/a").getValue(), '1.00000');
  const [start, end] = root.find("/a").getValueRange();
  t.is(text.substring(start, end), '1.00000');
});

test("AST Yaml Boundary Float Point Test", (t) => {

  const text = 'a: 1.000';
  const [root, errors] = parseYaml(text);
  t.is(root.find("/a").getValue(), '1.000');
  const [start, end] = root.find("/a").getValueRange();
  t.is(text.substring(start, end), '1.000');
});
