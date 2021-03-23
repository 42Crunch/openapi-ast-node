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
