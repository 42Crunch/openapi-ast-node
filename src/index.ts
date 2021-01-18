/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Node, Options } from "./types";
import { parseJson, JsonNode } from "./json";
import { parseYaml, findYamlNodeAtOffset, YamlNode } from "./yaml";
import { parseJsonPointer, joinJsonPointer } from "./pointer";

function parse(
  text: string,
  languageId: string,
  options: Options
): [Node, { message: string; offset: number }[]] {
  return languageId === "yaml" ? parseYaml(text, options?.yaml?.schema) : parseJson(text);
}

export { parse, parseYaml, parseJson, findYamlNodeAtOffset, Node, JsonNode, YamlNode, parseJsonPointer, joinJsonPointer };
