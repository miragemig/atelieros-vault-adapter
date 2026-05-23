import fs from "fs";
import path from "path";

const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";
const input = process.argv.slice(2).join(" ");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function timestamp(): string {
  return new Date().toISOString();
}

function inferWikilinks(text: string): string[] {
  const known = [
    "ZEUS Runtime",
    "Olympus",
    "Hestia",
    "Athena",
    "Ares",
    "Themis",
    "Hephaestus",
    "Hermes",
    "Runtime Governance",
    "Provider Layer",
    "Retrieval Layer",
    "Skill Registry",
    "Execution Policy",
    "SAFE_OVERNIGHT_MODE"
  ];

  return known.filter(k => text.toLowerCase().includes(k.toLowerCase()));
}

function main() {
  if (!input) {
    console.log('Usage: npm run zeus:hestia-write "memory text"');
    process.exit(1);
  }

  const dir = path.join(VAULT_PATH, "30-hestia-memory", "captures");
  fs.mkdirSync(dir, { recursive: true });

  const title = input.slice(0, 80);
  const filename = `${today()}-${slugify(title)}.md`;
  const filePath = path.join(dir, filename);
  const wikilinks = inferWikilinks(input);

  const content = `---
type: hestia-memory-capture
status: captured
created: ${timestamp()}
tags:
  - hestia
  - memory
  - runtime
wikilinks:
${wikilinks.map(w => `  - ${w}`).join("\n") || "  - Hestia"}
---

# ${title}

## Memory Capture

${input}

## Related

${wikilinks.map(w => `- [[${w}]]`).join("\n") || "- [[Hestia]]"}

## Notes

Captured by ZEUS Hestia memory writer.
`;

  fs.writeFileSync(filePath, content, "utf8");

  console.log("HESTIA MEMORY WRITTEN");
  console.log(`File: ${filePath}`);
  console.log(`Wikilinks: ${wikilinks.length ? wikilinks.join(", ") : "Hestia"}`);
}

main();
