import fs from "fs";
import path from "path";

const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";
const query = process.argv.slice(2).join(" ");

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMarkdownFiles(full));
    if (entry.isFile() && full.toLowerCase().endsWith(".md")) out.push(full);
  }

  return out;
}

function extractLinks(text: string): string[] {
  const wiki = [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1].trim());
  const yaml = [...text.matchAll(/wikilinks:\s*\[([^\]]+)\]/g)]
    .flatMap(m => m[1].split(",").map(x => x.trim()));
  return [...new Set([...wiki, ...yaml].filter(Boolean))];
}

function titleFromFile(file: string): string {
  return path.basename(file, ".md");
}

function main() {
  if (!query) {
    console.log('Usage: npm run zeus:hestia-graph "entity"');
    process.exit(1);
  }

  const files = collectMarkdownFiles(VAULT_PATH);
  const graph = new Map<string, Set<string>>();

  for (const file of files) {
    const title = titleFromFile(file);
    const content = fs.readFileSync(file, "utf8");
    const links = extractLinks(content);

    if (!graph.has(title)) graph.set(title, new Set());

    for (const link of links) {
      graph.get(title)!.add(link);
      if (!graph.has(link)) graph.set(link, new Set());
      graph.get(link)!.add(title);
    }
  }

  const key = [...graph.keys()].find(k => k.toLowerCase() === query.toLowerCase()) || query;
  const neighbours = [...(graph.get(key) || new Set())].sort();

  console.log("ZEUS HESTIA ENTITY GRAPH");
  console.log(`Vault: ${VAULT_PATH}`);
  console.log(`Entity: ${key}`);
  console.log("");

  if (neighbours.length === 0) {
    console.log("No linked entities found.");
    return;
  }

  console.log(key);
  for (const n of neighbours) {
    console.log(`├── ${n}`);
  }
}

main();
