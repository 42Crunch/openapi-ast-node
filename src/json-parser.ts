/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import {
  JSONVisitor,
  Node,
  NodeType,
  ParseError,
  ParseErrorCode,
  ParseOptions,
  visit,
} from "jsonc-parser";

interface NodeImpl extends Node {
  type: NodeType;
  value?: any;
  offset: number;
  length: number;
  colonOffset?: number;
  parent?: NodeImpl;
  children?: NodeImpl[];
}

namespace ParseOptions {
  export const DEFAULT = {
    allowTrailingComma: false,
  };
}

export declare const enum ExtendedErrorCode {
  DuplicateKey = 1,
}

export interface ExtendedError extends ParseError {
  error: ParseErrorCode;
  extendedError?: ExtendedErrorCode;
}

function getNodeType(value: any): NodeType {
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
    case "object": {
      if (!value) {
        return "null";
      } else if (Array.isArray(value)) {
        return "array";
      }
      return "object";
    }
    default:
      return "null";
  }
}

function findDuplicateKeys(children: NodeImpl[]): NodeImpl[] {
  const duplicates = [];
  for (let i = 0; i < children.length; i++) {
    const current = children[i];
    if (current.type === "property") {
      for (let j = 0; j < children.length; j++) {
        const other = children[j];
        if (
          other.type === "property" &&
          current.children[0].value === other.children[0].value &&
          i !== j
        ) {
          duplicates.push(children[i].children[0]);
        }
      }
    }
  }
  return duplicates;
}

/**
 * Parses the given text and returns a tree representation the JSON content. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
 */
export function parseTree(
  text: string,
  errors: ExtendedError[] = [],
  options: ParseOptions = ParseOptions.DEFAULT
): Node | undefined {
  let currentParent: NodeImpl = {
    type: "array",
    offset: -1,
    length: -1,
    children: [],
    parent: undefined,
  }; // artificial root

  function ensurePropertyComplete(endOffset: number) {
    if (currentParent.type === "property") {
      currentParent.length = endOffset - currentParent.offset;
      currentParent = currentParent.parent!;
    }
  }

  function onValue(valueNode: Node): Node {
    currentParent.children!.push(valueNode);
    return valueNode;
  }

  const visitor: JSONVisitor = {
    onObjectBegin: (offset: number) => {
      currentParent = onValue({
        type: "object",
        offset,
        length: -1,
        parent: currentParent,
        children: [],
      });
    },
    onObjectProperty: (name: string, offset: number, length: number) => {
      currentParent = onValue({
        type: "property",
        offset,
        length: -1,
        parent: currentParent,
        children: [],
      });
      currentParent.children!.push({
        type: "string",
        value: name,
        offset,
        length,
        parent: currentParent,
      });
    },
    onObjectEnd: (offset: number, length: number) => {
      ensurePropertyComplete(offset + length); // in case of a missing value for a property: make sure property is complete

      if (
        currentParent.type === "object" &&
        currentParent.children &&
        currentParent.children.length > 1
      ) {
        // for objects with more than 1 property try to find any duplicate keys
        const keys = findDuplicateKeys(currentParent.children);
        for (const { offset, length } of keys) {
          errors.push({
            error: 0,
            extendedError: ExtendedErrorCode.DuplicateKey,
            offset,
            length,
          });
        }
      }
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent!;
      ensurePropertyComplete(offset + length);
    },
    onArrayBegin: (offset: number, length: number) => {
      currentParent = onValue({
        type: "array",
        offset,
        length: -1,
        parent: currentParent,
        children: [],
      });
    },
    onArrayEnd: (offset: number, length: number) => {
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent!;
      ensurePropertyComplete(offset + length);
    },
    onLiteralValue: (value: any, offset: number, length: number) => {
      onValue({ type: getNodeType(value), offset, length, parent: currentParent, value });
      ensurePropertyComplete(offset + length);
    },
    onSeparator: (sep: string, offset: number, length: number) => {
      if (currentParent.type === "property") {
        if (sep === ":") {
          currentParent.colonOffset = offset;
        } else if (sep === ",") {
          ensurePropertyComplete(offset);
        }
      }
    },
    onError: (error: ParseErrorCode, offset: number, length: number) => {
      errors.push({ error, offset, length });
    },
  };
  visit(text, visitor, options);

  const result = currentParent.children![0];
  if (result) {
    delete result.parent;
  }
  return result;
}
