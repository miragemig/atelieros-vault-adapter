import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const root = process.cwd();

type SimpleSendLog = {
  id: string;
  createdAt: string;
  approvedBy: string | null;
  status: "ctrl_enter_sent" | "blocked";
  reasons: string[];
  note: string;
};

function parseApprovedBy(args: string[]): string | null {
  const index = args.indexOf("--approved-by");
  return index >= 0 ? args[index + 1] || null : null;
}

function runTs(script: string): { code: number; output: string } {
  try {
    const output = execFileSync(
      ".\\node_modules\\.bin\\tsx.cmd",
      [script],
      {
        cwd: root,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"]
      }
    ).trim();

    return { code: 0, output };
  } catch (error: any) {
    const stdout = error?.stdout?.toString?.() || "";
    const stderr = error?.stderr?.toString?.() || "";

    return {
      code: error?.status || 1,
      output: [stdout, stderr].filter(Boolean).join("\n").trim()
    };
  }
}

function sendCtrlEnter(): void {
  const psCommand = `
Add-Type -AssemblyName System.Windows.Forms

Write-Host ""
Write-Host "ZEUS simple send armed."
Write-Host "Click/focus the Gmail compose window now."
Write-Host "Sending Ctrl+Enter in 5 seconds..."
Start-Sleep -Seconds 5

[System.Windows.Forms.SendKeys]::SendWait("^{ENTER}")

Start-Sleep -Milliseconds 500
Write-Host "Ctrl+Enter sent to active window."
`;

  execFileSync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    psCommand
  ], {
    stdio: "inherit"
  });
}

function writeLog(log: SimpleSendLog): string {
  const dir = path.join(root, "founder-command-center", "hermes", "simple-send-log");
  fs.mkdirSync(dir, { recursive: true });

  const outputPath = path.join(dir, `${log.id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(log, null, 2), "utf-8");

  return outputPath;
}

function main() {
  const approvedBy = parseApprovedBy(process.argv.slice(2));
  const reasons: string[] = [];

  if (approvedBy !== "Miguel") {
    reasons.push("Missing explicit approval: --approved-by Miguel");
  }

  const readiness = runTs("founder-command-center\\hermes\\hermesSendReadiness.ts");

  if (readiness.code !== 0) {
    reasons.push("Send readiness failed.");
    if (readiness.output) reasons.push(readiness.output);
  }

  if (reasons.length > 0) {
    const blockedLog: SimpleSendLog = {
      id: `simple-send-${Date.now()}`,
      createdAt: new Date().toISOString(),
      approvedBy,
      status: "blocked",
      reasons,
      note: "No keyboard send action was performed."
    };

    const logPath = writeLog(blockedLog);

    console.log(JSON.stringify(blockedLog, null, 2));
    console.log(`Log created: ${logPath}`);
    process.exit(2);
  }

  sendCtrlEnter();

  const log: SimpleSendLog = {
    id: `simple-send-${Date.now()}`,
    createdAt: new Date().toISOString(),
    approvedBy,
    status: "ctrl_enter_sent",
    reasons: [],
    note:
      "Ctrl+Enter was sent to the active window. If Gmail compose was focused, the email may have been sent."
  };

  const logPath = writeLog(log);

  console.log(JSON.stringify(log, null, 2));
  console.log(`Log created: ${logPath}`);
}

main();

