import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = "G:\\ZEUS";
const REPORT_DIR = path.join(ROOT, "founder-command-center/runtime/reports/overnight");

const SAFE_COMMANDS = [
  'npm run zeus:hestia-brief "Olympus"',
  'npm run zeus:hestia-graph "Olympus"',
  'npm run zeus:handoff'
];

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const reportPath = path.join(
    REPORT_DIR,
    `${today()}-safe-overnight-report.md`
  );

  const lines: string[] = [];

  lines.push("# SAFE_OVERNIGHT_MODE REPORT");
  lines.push("");
  lines.push(`Started: ${now()}`);
  lines.push("");

  for (const command of SAFE_COMMANDS) {
    lines.push(`## COMMAND`);
    lines.push("```powershell");
    lines.push(command);
    lines.push("```");

    try {
      const output = execSync(command, {
        cwd: ROOT,
        encoding: "utf8",
        stdio: "pipe"
      });

      lines.push("Exit code: 0");
      lines.push("```text");
      lines.push(output.slice(0, 4000));
      lines.push("```");
    } catch (err: any) {
      lines.push(`Exit code: ${err.status ?? "unknown"}`);
      lines.push("```text");
      lines.push(String(err.stdout || err.stderr || err.message).slice(0, 4000));
      lines.push("```");
    }

    lines.push("");
  }

  lines.push("## SAFETY");
  lines.push("- No package.json modifications");
  lines.push("- No dependency installation");
  lines.push("- No destructive operations");
  lines.push("- No git push");
  lines.push("");

  lines.push(`Finished: ${now()}`);

  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");

  console.log("SAFE_OVERNIGHT_MODE COMPLETE");
  console.log(`Report: ${reportPath}`);
}

main();
