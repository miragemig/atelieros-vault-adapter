import fs from "fs";
import path from "path";

import { entityRegistry }
from "./brains/canonical/entityRegistry";

const wikiPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki"
);

const files =
  fs.readdirSync(wikiPath);

function replaceAliases(
  content: string
): string {

  let updated = content;

  for (
    const category
    of Object.values(entityRegistry)
  ) {

    for (
      const [canonical, aliases]
      of Object.entries(category)
    ) {

      for (const alias of aliases) {

        if (alias === canonical)
          continue;

        const escaped =
          alias.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

        const regex =
          new RegExp(
            escaped,
            "g"
          );

        updated =
          updated.replace(
            regex,
            canonical
          );
      }
    }
  }

  return updated;
}

for (const file of files) {

  if (!file.endsWith(".md"))
    continue;

  const fullPath =
    path.join(wikiPath, file);

  const content =
    fs.readFileSync(
      fullPath,
      "utf-8"
    );

  const updated =
    replaceAliases(content);

  fs.writeFileSync(
    fullPath,
    updated,
    "utf-8"
  );

  console.log(
    `Migrado: ${file}`
  );
}

console.log(
  "\nMigração concluída."
);