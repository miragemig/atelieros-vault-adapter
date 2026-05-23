import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = "G:\\ZEUS";
const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";
const REPORT_DIR = path.join(ROOT, "founder-command-center/runtime/reports/planner");

function run(command: string): string {
  try {
    return execSync(command, { cwd: ROOT, encoding: "utf8", stdio: "pipe" }).trim();
  } catch (err: any) {
    return String(err.stdout || err.stderr || err.message).trim();
  }
}

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMarkdownFiles(full));
    else if (entry.isFile() && full.toLowerCase().endsWith(".md")) out.push(full);
  }

  return out;
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const markdownFiles = collectMarkdownFiles(VAULT_PATH);
  const gitStatus = run("git status --short");
  const normalizer = run("npm run zeus:vault-normalize");
  const graph = run('npm run zeus:hestia-graph "Olympus"');

  const priorities: string[] = [];

  if (normalizer.includes("malformed") || normalizer.includes("Findings:")) {
    priorities.push("Normalize malformed vault files and remove corrupted path artifacts.");
  }

  if (graph.includes("No linked entities found")) {
    priorities.push("Improve wikilinks and entity graph connectivity.");
  } else {
    priorities.push("Improve graph quality by normalizing wikilinks and canonical entity names.");
  }

  if (gitStatus.trim()) {
    priorities.push("Review uncommitted working tree changes before further automation.");
  }

  priorities.push("Improve Hestia section ranking by filtering YAML/metadata noise.");
  priorities.push("Create SAFE_OVERNIGHT_MODE task queue for allowed maintenance tasks.");
  priorities.push("Prepare local Ollama provider integration after memory pipeline stabilizes.");

  const reportPath = path.join(REPORT_DIR, `task-plan-${Date.now()}.md`);

  const content = `# ZEUS TASK PLAN v0

## Runtime Inputs

- Repo: ${ROOT}
- Vault: ${VAULT_PATH}
- Markdown files scanned: ${markdownFiles.length}

## Git Status

\`\`\`text
${gitStatus || "clean"}
\`\`\`

## Vault Normalizer Signal

\`\`\`text
${normalizer.slice(0, 4000)}
\`\`\`

## Entity Graph Signal

\`\`\`text
${graph.slice(0, 4000)}
\`\`\`

## Priorities

${priorities.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## Recommended Next Task

${priorities[0]}

## Safety

This planner does not modify the vault, package.json, dependencies, git history, or runtime files.
`;

  fs.writeFileSync(reportPath, content, "utf8");

  console.log("ZEUS TASK PLAN");
  console.log(`Report: ${reportPath}`);
  console.log("");
  priorities.forEach((p, i) => console.log(`${i + 1}. ${p}`));
}

main();
