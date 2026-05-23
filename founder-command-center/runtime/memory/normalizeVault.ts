import fs from "fs";
import path from "path";

const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";

type Finding = {
  type: string;
  file: string;
  action: string;
};

function collectFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else out.push(full);
  }

  return out;
}

function main() {
  const files = collectFiles(VAULT_PATH);
  const findings: Finding[] = [];

  for (const file of files) {
    const name = path.basename(file);
    const relative = path.relative(VAULT_PATH, file);

    if (name.includes("20-architecture") && !relative.startsWith("20-architecture\\")) {
      findings.push({
        type: "malformed-architecture-path",
        file,
        action: "Review content, then move into G:\\ZEUS-VAULT\\20-architecture\\ or archive."
      });
    }

    if (name.includes(".get")) {
      findings.push({
        type: "pseudo-function-filename",
        file,
        action: "Likely generated artifact. Review and archive/delete."
      });
    }

    if (name === "Untitled.base" || name === "0-first-note.md") {
      findings.push({
        type: "placeholder-noise",
        file,
        action: "Archive/delete after confirming no unique content."
      });
    }

    if (!file.toLowerCase().endsWith(".md") && !relative.startsWith(".obsidian\\")) {
      findings.push({
        type: "non-markdown-vault-file",
        file,
        action: "Review manually."
      });
    }
  }

  console.log("ZEUS VAULT NORMALIZER v0");
  console.log(`Vault: ${VAULT_PATH}`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Findings: ${findings.length}`);
  console.log("");

  for (const f of findings) {
    console.log(`Type: ${f.type}`);
    console.log(`File: ${f.file}`);
    console.log(`Action: ${f.action}`);
    console.log("");
  }
}

main();
