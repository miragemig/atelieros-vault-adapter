import fs from "fs";
import path from "path";

const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";
const query = process.argv.slice(2).join(" ");

type FileScore = {
  file: string;
  score: number;
  snippets: string[];
};

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...collectMarkdownFiles(full));
    }

    if (entry.isFile() && full.toLowerCase().endsWith(".md")) {
      out.push(full);
    }
  }

  return out;
}

function main() {
  if (!query) {
    console.log('Usage: npm run zeus:hestia-brief "query"');
    process.exit(1);
  }

  const q = query.toLowerCase();
  const files = collectMarkdownFiles(VAULT_PATH);

  const results: FileScore[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    let score = 0;
    const snippets: string[] = [];

    lines.forEach((line) => {
      const lower = line.toLowerCase();

      if (lower.includes(q)) {
        score += 1;

        if (lower.includes("#")) score += 3;
        if (lower.includes("summary")) score += 2;
        if (lower.includes("wikilinks")) score += 2;
        if (lower.includes("role")) score += 1;

        if (snippets.length < 5) {
          snippets.push(line.trim());
        }
      }
    });

    if (file.toLowerCase().includes(q)) {
      score += 10;
    }

    if (score > 0) {
      results.push({
        file,
        score,
        snippets
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  console.log("ZEUS HESTIA BRIEF");
  console.log(`Vault: ${VAULT_PATH}`);
  console.log(`Query: ${query}`);
  console.log("");

  console.log("=== TOP FILES ===");

  for (const r of results.slice(0, 8)) {
    console.log("");
    console.log(`File: ${r.file}`);
    console.log(`Score: ${r.score}`);

    for (const s of r.snippets) {
      console.log(`- ${s}`);
    }
  }

  console.log("");
  console.log("=== OPERATIONAL SUMMARY ===");

  const topNames = results
    .slice(0, 5)
    .map(r => path.basename(r.file));

  console.log(`Primary query: ${query}`);
  console.log(`Most relevant files:`);

  for (const n of topNames) {
    console.log(`- ${n}`);
  }

  console.log("");
  console.log("Context compression completed.");
}

main();
