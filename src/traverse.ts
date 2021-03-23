import { joinJsonPointer } from "./pointer";

export function traverse<Node>(
  root: Node,
  path: string[],
  find: (parent: Node, name: string) => Node | undefined
): Node | undefined {
  let current = root;
  for (const name of path) {
    current = find(current, name);
    if (!current) {
      throw new Error(`Unable to find node with pointer: ${joinJsonPointer(path)}`);
    }
  }

  return current;
}
