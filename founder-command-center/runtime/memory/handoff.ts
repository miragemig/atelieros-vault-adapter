import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const REPO_PATH = "G:\\ZEUS";
const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";

function timestamp(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function run(command: string): string {
  try {
    return execSync(command, { cwd: REPO_PATH, encoding: "utf8" }).trim();
  } catch (err: any) {
    return String(err.stdout || err.stderr || err.message).trim();
  }
}

function countMarkdownFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;

  let count = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      count += countMarkdownFiles(full);
    } else if (entry.isFile() && full.toLowerCase().endsWith(".md")) {
      count++;
    }
  }

  return count;
}

function main() {
  const dir = path.join(VAULT_PATH, "30-hestia-memory", "handoffs");
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${today()}-zeus-handoff.md`);

  const gitStatus = run("git status --short");
  const gitLog = run("git log --oneline -5");
  const scripts = run("npm run --silent");
  const markdownCount = countMarkdownFiles(VAULT_PATH);

  const content = `---
type: zeus-handoff
status: generated
created: ${timestamp()}
tags:
  - zeus
  - hestia
  - handoff
  - runtime
wikilinks:
  - Hestia
  - ZEUS Runtime
  - Runtime Governance
---

# ZEUS Handoff — ${today()}

## Runtime State

- Repo: ${REPO_PATH}
- Vault: ${VAULT_PATH}
- Markdown files in vault: ${markdownCount}

## Recent Git Commits

\`\`\`text
${gitLog}
\`\`\`

## Working Tree

\`\`\`text
${gitStatus || "clean"}
\`\`\`

## Available ZEUS Scripts

\`\`\`text
${scripts.slice(0, 3000)}
\`\`\`

## Operational Summary

Current ZEUS runtime has:

- Hestia search
- Hestia context builder
- Hestia brief/context compression
- Hestia section retrieval
- ZEUS_AUTO v0
- Hestia memory writer
- Hestia handoff generator

## Next Recommended Actions

1. Improve retrieval quality by filtering malformed vault notes.
2. Add graph/entity extraction.
3. Add local model context injection.
4. Add SAFE_OVERNIGHT_MODE task queue.
5. Keep runtime local-first and zero-cost.

## Related

- [[Hestia]]
- [[ZEUS Runtime]]
- [[Runtime Governance]]
- [[SAFE_OVERNIGHT_MODE]]
`;

  fs.writeFileSync(filePath, content, "utf8");

  console.log("ZEUS HANDOFF WRITTEN");
  console.log(`File: ${filePath}`);
}

main();
