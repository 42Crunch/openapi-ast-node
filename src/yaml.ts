/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as yaml from "yaml-language-server-parser";
import { Schema, DEFAULT_SAFE_SCHEMA } from "js-yaml";
import { Node } from "./types";
import { parseJsonPointer, joinJsonPointer } from "./pointer";
import { find } from "./traverse";

export function parseYaml(
  text: string,
  schema?: Schema
): [YamlNode, { message: string; offset: number }[]] {
  const documents = [];
  yaml.loadAll(
    text,
    (document) => {
      documents.push(document);
    },
    { schema: schema ? schema : DEFAULT_SAFE_SCHEMA }
  );

  if (documents.length !== 1) {
    return [null, []];
  }

  const node = new YamlNode(documents[0]);

  const normalizedErrors = documents[0].errors.map((error) => ({
    message: error.message,
    offset: error.mark ? error.mark.position : 0,
  }));

  return [node, normalizedErrors];
}

export class YamlNode implements Node {
  node: yaml.YAMLNode;

  constructor(node: yaml.YAMLNode) {
    this.node = node;
  }

  find(pointer: string) {
    const node = find(this.node, parseJsonPointer(pointer), findChildByName);
    if (node) {
      return new YamlNode(node);
    }
  }

  getParent(): YamlNode {
    return this.node.parent.kind === yaml.Kind.MAP
      ? new YamlNode(this.node.parent)
      : new YamlNode(this.node.parent.parent);
  }

  getKey() {
    if (this.node.kind === yaml.Kind.MAPPING) {
      const mapping = <yaml.YAMLMapping>this.node;
      return mapping.key.value;
    } else if (this.node.parent && this.node.parent.kind === yaml.Kind.SEQ) {
      const seq = <yaml.YAMLSequence>this.node.parent;
      return String(seq.items.indexOf(this.node));
    } else if (this.node.parent && this.node.parent.kind === yaml.Kind.MAPPING) {
      return this.node.parent.key.value;
    }
  }

  getValue() {
    if (this.node.kind === yaml.Kind.MAPPING) {
      const mapping = <yaml.YAMLMapping>this.node;
      if (mapping && mapping.value && mapping.value.value) {
        return mapping.value.value;
      }
    } else if (this.node.kind === yaml.Kind.SCALAR) {
      // fixme should not happen
      return (<yaml.YAMLScalar>this.node).value;
    }
  }

  getRange(): [number, number] {
    return [this.node.startPosition, this.node.endPosition];
  }

  getKeyRange(): [number, number] | undefined {
    if (this.node.key) {
      return [this.node.key.startPosition, this.node.key.endPosition];
    }
  }

  getValueRange(): [number, number] | undefined {
    if (this.node) {
      if (this.node.kind === yaml.Kind.MAPPING) {
        return [this.node.value.startPosition, this.node.value.endPosition];
      }
      return [this.node.startPosition, this.node.endPosition];
    }
  }

  isArray(): boolean {
    return (
      this.node.kind === yaml.Kind.SEQ ||
      (this.node.kind === yaml.Kind.MAPPING && this.node.value.kind === yaml.Kind.SEQ)
    );
  }

  isObject(): boolean {
    return (
      this.node.kind === yaml.Kind.MAP ||
      (this.node.kind === yaml.Kind.MAPPING && this.node.value.kind === yaml.Kind.MAP)
    );
  }

  next(): YamlNode | undefined {
    const children = (
      this.node.parent.kind === yaml.Kind.MAP ? new YamlNode(this.node.parent) : this.getParent()
    ).getChildren();
    for (let i = 1; i < children.length; i++) {
      if (this.node === children[i - 1].node) {
        return children[i];
      }
    }
  }

  prev(): YamlNode | undefined {
    const children = (
      this.node.parent.kind === yaml.Kind.MAP ? new YamlNode(this.node.parent) : this.getParent()
    ).getChildren();
    for (let i = 0; i < children.length - 1; i++) {
      if (this.node === children[i + 1].node) {
        return children[i];
      }
    }
  }

  getChildren(): YamlNode[] {
    const result = [];
    if (this.node.kind === yaml.Kind.MAPPING) {
      const value = this.node.value;
      if (value && value.kind === yaml.Kind.MAP) {
        for (const mapping of value.mappings) {
          if (mapping) {
            result.push(new YamlNode(mapping));
          }
        }
      } else if (value && value.kind === yaml.Kind.SEQ) {
        for (const item of value.items) {
          if (item) {
            result.push(new YamlNode(item));
          }
        }
      }
    } else if (this.node.kind === yaml.Kind.MAP) {
      for (const mapping of this.node.mappings) {
        result.push(new YamlNode(mapping));
      }
    } else if (this.node.kind === yaml.Kind.SEQ) {
      for (const item of this.node.value.items) {
        if (item) {
          result.push(new YamlNode(item));
        }
      }
    }
    return result;
  }

  getDepth(): number {
    let depth = 0;
    let parent = this.node.parent;
    while (parent) {
      if (parent.kind === yaml.Kind.MAP || parent.kind === yaml.Kind.SEQ) {
        depth++;
      }
      parent = parent.parent;
    }
    return depth;
  }

  findNodeAtOffset(offset: number): YamlNode | undefined {
    const found = findYamlNodeAtOffset(this.node, offset);
    if (found) {
      if (found.kind === yaml.Kind.SCALAR) {
        return new YamlNode(found.parent);
      } else if (found.kind === yaml.Kind.MAPPING) {
        return new YamlNode(found);
      } else if (found.kind === yaml.Kind.SEQ) {
        return new YamlNode(found);
      }
    }
  }

  getJsonPonter(): string {
    const path = [];
    let node = this.node;
    while (node) {
      if (node.kind === yaml.Kind.MAPPING) {
        const mapping = <yaml.YAMLMapping>node;
        path.push(mapping.key.value);
      } else if (node.parent && node.parent.kind === yaml.Kind.SEQ) {
        const seq = <yaml.YAMLSequence>node.parent;
        path.push(seq.items.indexOf(node));
      }
      node = node.parent;
    }

    return joinJsonPointer(path.reverse());
  }
}

function findChildByName(parent: yaml.YAMLNode, name: string): yaml.YAMLNode | undefined {
  if (parent.kind === yaml.Kind.MAP) {
    return getChildFromMap(<yaml.YamlMap>parent, name);
  } else if (parent.kind === yaml.Kind.SEQ) {
    return getChildFromSeq(<yaml.YAMLSequence>parent, name);
  } else if (parent.kind === yaml.Kind.MAPPING) {
    return findChildByName(parent.value, name);
  } else if (parent.kind === yaml.Kind.ANCHOR_REF) {
    return findChildByName(parent.value, name);
  }
}

function getChildFromMap(parent: yaml.YamlMap, name: string): yaml.YAMLNode | undefined {
  // check all mappings for the specified key first
  for (const mapping of parent.mappings) {
    if (mapping.key && mapping.key.kind === yaml.Kind.SCALAR && mapping.key.value === name) {
      return mapping;
    }
  }
  // now check if there is an anchor and check it as well
  for (const mapping of parent.mappings) {
    if (
      mapping.key &&
      mapping.key.kind === yaml.Kind.SCALAR &&
      mapping.key.value === "<<" &&
      mapping.value.kind === yaml.Kind.ANCHOR_REF
    ) {
      const mergeKey = <yaml.YAMLAnchorReference>mapping.value;
      return findChildByName(mergeKey, name);
    }
  }
}

function getChildFromSeq(parent: yaml.YAMLSequence, name: string): yaml.YAMLNode | undefined {
  const index = parseInt(name as string, 10);
  // TODO check bounds
  const mapping = parent.items[index];
  return mapping;
}

function contains(node: yaml.YAMLNode, offset: number) {
  return offset >= node.startPosition && offset <= node.endPosition;
}

export function findYamlNodeAtOffset(node: yaml.YAMLNode, offset: number): yaml.YAMLNode {
  if (contains(node, offset)) {
    if (node.kind === yaml.Kind.MAPPING) {
      const yamlMapping = <yaml.YAMLMapping>node;
      const foundInKey = findYamlNodeAtOffset(yamlMapping.key, offset);
      if (foundInKey) {
        return foundInKey;
      }

      // in case of partial yaml like "foo:" yamlMapping.value could be null
      // in this case do not try to descend it and return key instead
      if (yamlMapping.value === null) {
        return yamlMapping.key;
      } else {
        const foundInValue = findYamlNodeAtOffset(yamlMapping.value, offset);
        if (foundInValue) {
          return foundInValue;
        }
      }
    } else if (node.kind === yaml.Kind.MAP) {
      const yamlMap = <yaml.YamlMap>node;
      for (const mapping of yamlMap.mappings) {
        const foundInMapping = findYamlNodeAtOffset(mapping, offset);
        if (foundInMapping) {
          return foundInMapping;
        }
      }
      // this node contains the offset, but we didn't find it in the mappings
      // lets set the offset to the end of the last mapping and retry
      const lastMapping = yamlMap.mappings[yamlMap.mappings.length - 1];
      return findYamlNodeAtOffset(lastMapping, lastMapping.endPosition);
    } else if (node.kind === yaml.Kind.SEQ) {
      const yamlSeq = <yaml.YAMLSequence>node;
      for (const item of yamlSeq.items) {
        const found = findYamlNodeAtOffset(item, offset);
        if (found) {
          return found;
        }
      }
    }
    return node;
  }
  return null;
}
