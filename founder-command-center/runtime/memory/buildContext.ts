import fs from "fs";
import path from "path";

const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";
const query = process.argv.slice(2).filter(a => a !== "--json").join(" ");
const jsonMode = process.argv.includes("--json");

type Match = {
  file: string;
  line: number;
  previous: string;
  match: string;
  next: string;
  score: number;
};

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

function scoreLine(file: string, line: string, q: string): number {
  let score = 1;
  const lowerFile = file.toLowerCase();
  const lowerLine = line.toLowerCase();

  if (lowerFile.includes(q)) score += 5;
  if (lowerLine.includes(`# ${q}`)) score += 5;
  if (lowerLine.includes(`[[${q}`)) score += 3;
  if (lowerLine.includes("summary")) score += 1;

  return score;
}

function extractWikilinks(text: string): string[] {
  const matches = [...text.matchAll(/\[\[([^\]]+)\]\]/g)];
  return [...new Set(matches.map(m => m[1].trim()))];
}

function main() {
  if (!query) {
    console.log('Usage: npm run zeus:hestia-context "query"');
    process.exit(1);
  }

  const q = query.toLowerCase();
  const files = collectMarkdownFiles(VAULT_PATH);
  const matches: Match[] = [];
  const relatedEntities = new Set<string>();

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    extractWikilinks(content).forEach(e => relatedEntities.add(e));

    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(q) || file.toLowerCase().includes(q)) {
        matches.push({
          file,
          line: i + 1,
          previous: lines[i - 1] || "",
          match: line,
          next: lines[i + 1] || "",
          score: scoreLine(file, line, q),
        });
      }
    });
  }

  matches.sort((a, b) => b.score - a.score);

  const result = {
    query,
    vaultPath: VAULT_PATH,
    markdownFilesScanned: files.length,
    matchCount: matches.length,
    topMatches: matches.slice(0, 12),
    relatedEntities: [...relatedEntities].filter(e =>
      e.toLowerCase().includes(q) ||
      matches.some(m => m.file.toLowerCase().includes(e.toLowerCase()))
    ).slice(0, 20)
  };

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`ZEUS HESTIA CONTEXT`);
  console.log(`Vault: ${result.vaultPath}`);
  console.log(`Files scanned: ${result.markdownFilesScanned}`);
  console.log(`Query: ${result.query}`);
  console.log(`Matches: ${result.matchCount}`);
  console.log("");

  console.log("=== PRIMARY MATCHES ===");
  for (const m of result.topMatches) {
    console.log(`File: ${m.file}`);
    console.log(`Line: ${m.line}`);
    console.log(`Score: ${m.score}`);
    console.log(`Previous: ${m.previous}`);
    console.log(`Match: ${m.match}`);
    console.log(`Next: ${m.next}`);
    console.log("");
  }

  console.log("=== RELATED ENTITIES ===");
  if (result.relatedEntities.length === 0) console.log("(none)");
  for (const e of result.relatedEntities) console.log(`- ${e}`);
}

main();
