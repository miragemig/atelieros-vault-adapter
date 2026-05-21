import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const root = process.cwd();

function chromePath(): string {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    throw new Error("Chrome executable not found.");
  }

  return found;
}

function main() {
  const chrome = chromePath();
  const debugPort = process.env.ZEUS_CHROME_DEBUG_PORT || "9222";

  const userDataDir =
    process.env.ZEUS_CHROME_USER_DATA_DIR ||
    path.join(root, "founder-command-center", "hermes", "chrome-debug-profile");

  fs.mkdirSync(userDataDir, { recursive: true });

  const child = spawn(
    chrome,
    [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "--new-window",
      "https://mail.google.com/mail/"
    ],
    {
      detached: true,
      stdio: "ignore"
    }
  );

  child.unref();

  const stateDir = path.join(root, "founder-command-center", "hermes", "state");
  fs.mkdirSync(stateDir, { recursive: true });

  const statePath = path.join(stateDir, "chrome-debug-session.json");

  fs.writeFileSync(
    statePath,
    JSON.stringify(
      {
        pid: child.pid,
        debugPort,
        userDataDir,
        createdAt: new Date().toISOString()
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`Chrome debug launched on port ${debugPort}`);
  console.log(`PID: ${child.pid}`);
  console.log(`User data dir: ${userDataDir}`);
  console.log(`State saved: ${statePath}`);
}

main();
