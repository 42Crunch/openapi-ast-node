/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

export function traverse<Node>(
  root: Node,
  path: string[],
  find: (parent: Node, name: string) => Node | undefined
): Node | undefined {
  let current = root;
  for (const name of path) {
    current = find(current, name);
    if (!current) {
      return;
    }
  }

  return current;
}
