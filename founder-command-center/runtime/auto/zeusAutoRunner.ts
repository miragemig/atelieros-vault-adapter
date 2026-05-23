import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const REPO_PATH = "G:\\ZEUS";
const QUEUE_PATH = path.join(REPO_PATH, "founder-command-center", "runtime", "queue", "tasks.json");
const REPORT_DIR = path.join(REPO_PATH, "founder-command-center", "runtime", "reports", "auto");

function now() {
  return new Date().toISOString();
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  if (!fs.existsSync(QUEUE_PATH)) {
    console.error(`Task queue not found: ${QUEUE_PATH}`);
    process.exit(1);
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  const task = queue.tasks.find((t: any) => t.status === "pending");

  if (!task) {
    console.log("No pending tasks.");
    return;
  }

  task.status = "running";
  task.startedAt = now();

  const reportLines: string[] = [];
  reportLines.push(`# ZEUS AUTO REPORT`);
  reportLines.push(``);
  reportLines.push(`Task: ${task.id}`);
  reportLines.push(`Goal: ${task.goal}`);
  reportLines.push(`Started: ${task.startedAt}`);
  reportLines.push(``);

  let failed = false;

  for (const command of task.commands || []) {
    reportLines.push(`## Command`);
    reportLines.push("```powershell");
    reportLines.push(command);
    reportLines.push("```");

    try {
      const output = execSync(command, {
        cwd: REPO_PATH,
        encoding: "utf8",
        stdio: "pipe"
      });

      reportLines.push(`Exit code: 0`);
      reportLines.push("```text");
      reportLines.push(output.slice(0, 4000));
      reportLines.push("```");
    } catch (err: any) {
      failed = true;
      reportLines.push(`Exit code: ${err.status ?? "unknown"}`);
      reportLines.push("```text");
      reportLines.push(String(err.stdout || err.stderr || err.message).slice(0, 4000));
      reportLines.push("```");
    }

    reportLines.push("");
  }

  task.status = failed ? "failed" : "completed";
  task.completedAt = now();

  const reportPath = path.join(REPORT_DIR, `${task.id}-${Date.now()}.md`);
  fs.writeFileSync(reportPath, reportLines.join("\n"), "utf8");

  task.report = reportPath;
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), "utf8");

  console.log(`Task ${task.status}: ${task.id}`);
  console.log(`Report: ${reportPath}`);
}

main();
