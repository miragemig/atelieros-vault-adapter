import fs from "fs";
import path from "path";

const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";
const query = process.argv.slice(2).join(" ");

type Section = {
  file: string;
  heading: string;
  content: string[];
  score: number;
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
    console.log('Usage: npm run zeus:hestia-sections "query"');
    process.exit(1);
  }

  const q = query.toLowerCase();
  const files = collectMarkdownFiles(VAULT_PATH);

  const sections: Section[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    let currentHeading = "ROOT";
    let currentContent: string[] = [];

    function flushSection() {
      if (currentContent.length === 0) return;

      const joined = currentContent.join("\n").toLowerCase();

      if (
        joined.includes(q) ||
        currentHeading.toLowerCase().includes(q) ||
        file.toLowerCase().includes(q)
      ) {
        let score = 1;

        if (currentHeading.toLowerCase().includes(q)) score += 10;
        if (joined.includes("summary")) score += 3;
        if (joined.includes("responsibilities")) score += 3;
        if (joined.includes("runtime")) score += 2;

        sections.push({
          file,
          heading: currentHeading,
          content: [...currentContent],
          score
        });
      }
    }

    for (const line of lines) {
      if (line.startsWith("#")) {
        flushSection();

        currentHeading = line.replace(/^#+/, "").trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    flushSection();
  }

  sections.sort((a, b) => b.score - a.score);

  console.log("ZEUS HESTIA SECTION RETRIEVAL");
  console.log(`Vault: ${VAULT_PATH}`);
  console.log(`Query: ${query}`);
  console.log(`Sections: ${sections.length}`);
  console.log("");

  for (const s of sections.slice(0, 8)) {
    console.log("=================================");
    console.log(`FILE: ${s.file}`);
    console.log(`SECTION: ${s.heading}`);
    console.log(`SCORE: ${s.score}`);
    console.log("");

    for (const line of s.content.slice(0, 20)) {
      console.log(line);
    }

    console.log("");
  }
}

main();
