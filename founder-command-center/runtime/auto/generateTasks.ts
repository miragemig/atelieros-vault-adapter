import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = "G:\\ZEUS";
const QUEUE_PATH = path.join(ROOT, "founder-command-center/runtime/queue/tasks.json");
const REPORT_DIR = path.join(ROOT, "founder-command-center/runtime/reports/task-generation");

function run(command: string): string {
  try {
    return execSync(command, { cwd: ROOT, encoding: "utf8", stdio: "pipe" }).trim();
  } catch (err: any) {
    return String(err.stdout || err.stderr || err.message).trim();
  }
}

function loadQueue(): any {
  if (!fs.existsSync(QUEUE_PATH)) {
    return { version: "0.1.0", tasks: [] };
  }

  const raw = fs.readFileSync(QUEUE_PATH, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function saveQueue(queue: any) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), "utf8");
}

function hasTask(queue: any, id: string): boolean {
  return (queue.tasks || []).some((t: any) => t.id === id);
}

function addTask(queue: any, task: any) {
  if (!queue.tasks) queue.tasks = [];

  if (!hasTask(queue, task.id)) {
    queue.tasks.push(task);
    return true;
  }

  return false;
}

function now(): string {
  return new Date().toISOString();
}

function main() {
  fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const queue = loadQueue();

  const normalizer = run("npm run zeus:vault-normalize");
  const gitStatus = run("git status --short");
  const graphOlympus = run('npm run zeus:hestia-graph "Olympus"');

  const generated: any[] = [];

  if (normalizer.includes("Findings:") && !normalizer.includes("Findings: 0")) {
    generated.push({
      id: "review-vault-normalizer-findings",
      status: "pending",
      type: "maintenance",
      goal: "Review ZEUS vault normalizer findings and identify malformed or noisy vault files",
      createdAt: now(),
      startedAt: null,
      completedAt: null,
      allowedFiles: [
        "founder-command-center/runtime/memory/normalizeVault.ts"
      ],
      commands: [
        "npm run zeus:vault-normalize"
      ],
      successCriteria: [
        "command exits with code 0",
        "normalizer report is produced",
        "no files are modified",
        "no deletes are performed"
      ],
      report: null
    });
  }

  if (graphOlympus.includes("No linked entities found")) {
    generated.push({
      id: "improve-olympus-graph-links",
      status: "pending",
      type: "memory-graph",
      goal: "Improve Olympus graph links by identifying missing wikilinks and related entities",
      createdAt: now(),
      startedAt: null,
      completedAt: null,
      allowedFiles: [
        "founder-command-center/runtime/memory/buildGraph.ts"
      ],
      commands: [
        "npm run zeus:hestia-graph \"Olympus\""
      ],
      successCriteria: [
        "command exits with code 0",
        "Olympus graph output is produced",
        "no vault files are modified"
      ],
      report: null
    });
  }

  if (gitStatus.trim()) {
    generated.push({
      id: "review-working-tree-state",
      status: "pending",
      type: "git-hygiene",
      goal: "Review current git working tree state before further automation",
      createdAt: now(),
      startedAt: null,
      completedAt: null,
      allowedFiles: [],
      commands: [
        "npm run zeus:status"
      ],
      successCriteria: [
        "working tree status is inspected",
        "no destructive git commands are run"
      ],
      report: null
    });
  }

  generated.push({
    id: "generate-session-handoff",
    status: "pending",
    type: "handoff",
    goal: "Generate ZEUS session handoff for runtime continuity",
    createdAt: now(),
    startedAt: null,
    completedAt: null,
    allowedFiles: [
      "founder-command-center/runtime/memory/handoff.ts"
    ],
    commands: [
      "npm run zeus:handoff"
    ],
    successCriteria: [
      "command exits with code 0",
      "handoff file is generated in ZEUS vault",
      "no destructive operation is performed"
    ],
    report: null
  });

  let added = 0;

  for (const task of generated) {
    if (addTask(queue, task)) {
      added++;
    }
  }

  saveQueue(queue);

  const reportPath = path.join(REPORT_DIR, `generated-tasks-${Date.now()}.md`);

  const content = `# ZEUS TASK GENERATION REPORT

Generated at: ${now()}

## Signals

### Vault Normalizer

\`\`\`text
${normalizer.slice(0, 3000)}
\`\`\`

### Olympus Graph

\`\`\`text
${graphOlympus.slice(0, 3000)}
\`\`\`

### Git Status

\`\`\`text
${gitStatus || "clean"}
\`\`\`

## Tasks proposed

${generated.map(t => `- ${t.id}: ${t.goal}`).join("\n")}

## Tasks added to queue

${added}

## Queue

${QUEUE_PATH}
`;

  fs.writeFileSync(reportPath, content, "utf8");

  console.log("ZEUS TASK GENERATION");
  console.log(`Tasks proposed: ${generated.length}`);
  console.log(`Tasks added: ${added}`);
  console.log(`Queue: ${QUEUE_PATH}`);
  console.log(`Report: ${reportPath}`);
}

main();
