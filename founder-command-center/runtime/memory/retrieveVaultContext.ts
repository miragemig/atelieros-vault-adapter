import fs from "fs";
import path from "path";

const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";
const query = process.argv.slice(2).join(" ");

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && fullPath.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  if (!query) {
    console.log("Usage: npm run zeus:hestia-search \"query\"");
    process.exit(1);
  }

  const markdownFiles = collectMarkdownFiles(VAULT_PATH);
  const queryLower = query.toLowerCase();
  let matchCount = 0;

  console.log(`Searched vault path: ${VAULT_PATH}`);
  console.log(`Markdown files scanned: ${markdownFiles.length}`);
  console.log(`Query: ${query}`);
  console.log("");

  for (const file of markdownFiles) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(queryLower)) {
        matchCount++;

        console.log("Match:");
        console.log(`File: ${file}`);
        console.log(`Line: ${index + 1}`);
        console.log(`Previous: ${lines[index - 1] || ""}`);
        console.log(`Match: ${line}`);
        console.log(`Next: ${lines[index + 1] || ""}`);
        console.log("");
      }
    });
  }

  if (matchCount === 0) {
    console.log("No matches found");
  }
}

main();
