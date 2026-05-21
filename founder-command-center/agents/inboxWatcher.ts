import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const inboxPath = path.join(process.cwd(), "founder-command-center/support/inbox");

const timers = new Map<string, NodeJS.Timeout>();
const processed = new Set<string>();

function scheduleProcess(filePath: string) {
  const fileName = path.basename(filePath);

  if (!fileName.endsWith(".txt")) return;
  if (processed.has(fileName)) return;

  if (timers.has(fileName)) {
    clearTimeout(timers.get(fileName));
  }

  const timer = setTimeout(() => {
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8").trim();

    if (!content) {
      console.log("Ignoring empty ticket:", fileName);
      return;
    }

    processed.add(fileName);

    console.log("\nNew support ticket detected:");
    console.log(filePath);

    try {
      execSync(
        `npx tsx founder-command-center/agents/supportAgent.ts "${filePath}"`,
        {
          stdio: "inherit",
          shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh"
        }
      );

      console.log("\nSupportAgent executed successfully.");
    } catch {
      console.error("\nSupportAgent execution failed.");
    }
  }, 2500);

  timers.set(fileName, timer);
}

console.log("\n=== INBOX WATCHER STARTED ===\n");
console.log("Watching:", inboxPath);

const watcher = chokidar.watch(inboxPath, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 250
  }
});

watcher.on("add", scheduleProcess);
watcher.on("change", scheduleProcess);