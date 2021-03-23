/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as json from "jsonc-parser";
import { Node } from "./types";
import { parseJsonPointer, joinJsonPointer } from "./pointer";
import { find } from "./traverse";

export function parseJson(text: string): [JsonNode, { message: string; offset: number }[]] {
  const parseErrors: json.ParseError[] = [];
  const node = new JsonNode(
    json.parseTree(text, parseErrors, {
      allowTrailingComma: true,
      allowEmptyContent: true,
    })
  );
  const normalizedErrors = parseErrors.map((error) => ({
    message: json.printParseErrorCode(error.error),
    offset: error.offset,
  }));

  return [node, normalizedErrors];
}

export class JsonNode implements Node {
  node: json.Node;

  constructor(node: json.Node) {
    this.node = node;
  }

  find(pointer: string) {
    const node = find(this.node, parseJsonPointer(pointer), findChildByName);
    if (node) {
      return new JsonNode(node);
    }
  }

  getParent(): JsonNode {
    // each value node must have either property or array as it's parent
    // but check for type=object parent just in case
    const parent = this.node.parent;
    if (parent) {
      if (parent.type === "property") {
        return new JsonNode(parent.parent);
      } else if (parent.type === "array" || parent.type === "object") {
        return new JsonNode(parent);
      }
    }
  }

  getKey(): string {
    const parent = this.node.parent;
    if (parent) {
      if (parent.type === "property") {
        return parent.children[0].value;
      } else if (parent.type === "array") {
        return String(parent.children.indexOf(this.node));
      }
    }
    return null;
  }

  getValue(): string {
    return this.node.value;
  }

  getRange(): [number, number] {
    return [this.node.offset, this.node.offset + this.node.length];
  }

  getKeyRange(): [number, number] | undefined {
    const parent = this.node.parent;
    if (parent) {
      if (parent.type === "property") {
        const key = parent.children[0];
        return [key.offset + 1, key.offset + key.length - 1];
      }
    }
  }

  getValueRange(): [number, number] | undefined {
    return this.getRange();
  }

  getChildren(): JsonNode[] {
    if (this.node.type === "object") {
      return this.node.children.map((child) => new JsonNode(child.children[1]));
    } else if (this.node.type === "array") {
      return this.node.children.map((child) => new JsonNode(child));
    }
  }

  next(): JsonNode | undefined {
    const children = this.getParent().getChildren();
    for (let i = 1; i < children.length; i++) {
      if (this.node === children[i - 1].node) {
        return children[i];
      }
    }
  }

  prev(): JsonNode | undefined {
    const children = this.getParent().getChildren();
    for (let i = 0; i < children.length - 1; i++) {
      if (this.node === children[i + 1].node) {
        return children[i];
      }
    }
  }

  getDepth(): number {
    let depth = 0;
    let parent = this.node.parent;
    while (parent) {
      if (parent.type === "object" || parent.type === "array") {
        depth++;
      }
      parent = parent.parent;
    }
    return depth;
  }

  findNodeAtOffset(offset: number) {
    const node = json.findNodeAtOffset(this.node, offset);
    if (node) {
      return new JsonNode(node);
    }
    return null;
  }

  getJsonPonter(): string {
    return joinJsonPointer(json.getNodePath(this.node));
  }

  isArray(): boolean {
    return this.node.type === "array";
  }

  isObject(): boolean {
    return this.node.type === "object";
  }
}

function findChildByName(parent: json.Node, name: string): json.Node | undefined {
  if (parent.type === "object") {
    return getChildFromObject(parent, name);
  } else {
    return getChildFromArray(parent, name);
  }
}

function getChildFromObject(objectNode: json.Node, name: string) {
  if (!objectNode.children) {
    return null;
  }
  for (let propertyNode of objectNode.children) {
    if (Array.isArray(propertyNode.children) && propertyNode.children[0].value === name) {
      return propertyNode.children[1];
    }
  }
  return null;
}

function getChildFromArray(arrayNode: json.Node, propertyIndex: string) {
  const index = parseInt(propertyIndex, 10);
  if (
    arrayNode.type === "array" &&
    index >= 0 &&
    Array.isArray(arrayNode.children) &&
    index < arrayNode.children.length
  ) {
    return arrayNode.children[index];
  }
  return null;
}
