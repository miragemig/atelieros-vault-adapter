import fs from "fs";
import path from "path";

const ROOT = "G:\\ZEUS";
const QUEUE_PATH = path.join(ROOT, "founder-command-center/runtime/queue/tasks.json");

const FORBIDDEN_PATTERNS = [
  /Remove-Item/i,
  /\brm\b/i,
  /\brmdir\b/i,
  /del\s+/i,
  /npm\s+install/i,
  /pnpm\s+add/i,
  /yarn\s+add/i,
  /git\s+push/i,
  /git\s+reset/i,
  /git\s+clean/i,
  /G:\\ZEUS\\Vaul/i,
  /G:\\ZEUS\\VAULT/i
];

const ALLOWED_PREFIXES = [
  "npm run zeus:hestia-search",
  "npm run zeus:hestia-context",
  "npm run zeus:hestia-brief",
  "npm run zeus:hestia-sections",
  "npm run zeus:hestia-graph",
  "npm run zeus:handoff",
  "npm run zeus:vault-normalize",
  "npm run zeus:status"
];

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) {
    throw new Error(`Task queue not found: ${QUEUE_PATH}`);
  }

  const raw = fs.readFileSync(QUEUE_PATH, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function isAllowed(command: string): boolean {
  return ALLOWED_PREFIXES.some(prefix => command.startsWith(prefix));
}

function hasForbidden(command: string): string | null {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(command)) return pattern.toString();
  }
  return null;
}

function main() {
  const queue = loadQueue();
  const tasks = queue.tasks || [];

  let failed = false;

  console.log("ZEUS POLICY CHECK v0");
  console.log(`Tasks checked: ${tasks.length}`);
  console.log("");

  for (const task of tasks) {
    console.log(`Task: ${task.id}`);
    const commands: string[] = task.commands || [];

    if (commands.length === 0) {
      console.log("Status: FAIL");
      console.log("Reason: no commands declared");
      failed = true;
      console.log("");
      continue;
    }

    for (const command of commands) {
      const forbidden = hasForbidden(command);
      const allowed = isAllowed(command);

      console.log(`Command: ${command}`);

      if (forbidden) {
        console.log("Policy: BLOCKED");
        console.log(`Reason: forbidden pattern ${forbidden}`);
        failed = true;
      } else if (!allowed) {
        console.log("Policy: BLOCKED");
        console.log("Reason: command prefix not allowlisted");
        failed = true;
      } else {
        console.log("Policy: ALLOWED");
      }
    }

    console.log("");
  }

  if (failed) {
    console.log("POLICY CHECK FAILED");
    process.exit(1);
  }

  console.log("POLICY CHECK PASSED");
}

main();
