import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const intervalMinutes = 10;

const logPath = path.join(
  process.cwd(),
  "founder-command-center/runtime/daemon.log"
);

let isRunning = false;

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logPath, line, "utf-8");
  console.log(message);
}

function runCommanderCycle() {
  if (isRunning) {
    log("Cycle skipped: previous cycle still running.");
    return;
  }

  isRunning = true;

  try {
    log("Commander cycle started.");

    execSync(
      "npx tsx founder-command-center\\agents\\commanderOrchestrator.ts",
      {
        stdio: "inherit",
        shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh"
      }
    );

    log("Commander cycle completed.");
  } catch (error) {
    log("Commander cycle failed.");
  } finally {
    isRunning = false;
  }
}

log("Founder Command Center Daemon started.");
log(`Interval: ${intervalMinutes} minutes.`);

runCommanderCycle();

setInterval(() => {
  runCommanderCycle();
}, intervalMinutes * 60 * 1000);