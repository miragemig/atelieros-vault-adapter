import fs from "fs";
import path from "path";

const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";

type Issue = {
  type: string;
  file: string;
  reason: string;
  recommendation: string;
};

function collectFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...collectFiles(full));
    } else {
      out.push(full);
    }
  }

  return out;
}

function main() {
  const files = collectFiles(VAULT_PATH);
  const issues: Issue[] = [];

  for (const file of files) {
    const relative = path.relative(VAULT_PATH, file);
    const name = path.basename(file);

    if (!file.toLowerCase().endsWith(".md") && !relative.startsWith(".obsidian")) {
      issues.push({
        type: "non-markdown-file",
        file,
        reason: "File is not markdown and is outside .obsidian.",
        recommendation: "Review manually. Move to cleanup/archive or delete if junk."
      });
    }

    if (
      name.includes("20-architectureProvider") ||
      name.includes("20-architectureExecution") ||
      name.includes("20-architectureRuntime") ||
      name.includes(".getRuntimeGovernance")
    ) {
      issues.push({
        type: "malformed-filename",
        file,
        reason: "Filename appears to contain a broken path or generated pseudo-function name.",
        recommendation: "Move useful content into the correct file under 20-architecture, then archive/delete this artifact."
      });
    }

    if (name === "Untitled.base" || name === "0-first-note.md") {
      issues.push({
        type: "noise-file",
        file,
        reason: "Early placeholder/noise file.",
        recommendation: "Archive or delete after confirming no unique useful content."
      });
    }
  }

  console.log("ZEUS HESTIA VAULT SANITIZER");
  console.log(`Vault: ${VAULT_PATH}`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Issues found: ${issues.length}`);
  console.log("");

  if (issues.length === 0) {
    console.log("No issues found.");
    return;
  }

  for (const issue of issues) {
    console.log("Issue:");
    console.log(`Type: ${issue.type}`);
    console.log(`File: ${issue.file}`);
    console.log(`Reason: ${issue.reason}`);
    console.log(`Recommendation: ${issue.recommendation}`);
    console.log("");
  }
}

main();
