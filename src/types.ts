/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Schema } from "js-yaml";

export interface Options {
  yaml?: {
    schema?: Schema;
  };
}

export interface Node {
  getChildren(): Node[];
  getDepth(): number;
  getKey(): string;
  getValue(): string;
  getParent(): Node;
  find(pointer: string): Node;
  resolve(pointer: string, resolveReference: (reference: string) => Node | undefined): Node;
  getRange(): [number, number];
  getKeyRange(): [number, number] | undefined;
  getValueRange(): [number, number] | undefined;
  findNodeAtOffset(offset: number): Node | undefined;
  getJsonPonter(): string;
  next(): Node | undefined;
  prev(): Node | undefined;
  isArray(): boolean;
  isObject(): boolean;
}
