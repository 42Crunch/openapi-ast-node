/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

export function find<Node>(
  root: Node,
  path: string[],
  findByName: (node: Node, property: string) => Node | undefined
): Node | undefined {
  let current = root;
  for (const name of path) {
    current = findByName(current, name);
    if (!current) {
      return;
    }
  }

  return current;
}

export function resolve<Node>(
  root: Node,
  path: string[],
  findByName: (node: Node, property: string) => Node | undefined,
  getReference: (node: Node) => string | undefined,
  resolveReference: (reference: string) => Node | undefined
): Node | undefined {
  let current = root;
  for (let i = 0; i < path.length && current; i++) {
    const name = path[i];
    const nextName = i + 1 < path.length ? path[i + 1] : null;
    current = findByName(current, name);
    // do not attempt to check and resolve reference if the next in path is $ref
    // this allows for json paths that target $ref attribute itself, i.e. /foo/$ref
    if (current && nextName != "$ref") {
      const ref = getReference(current);
      if (ref) {
        current = resolveReference(ref);
      }
    }
  }

  return current;
}
