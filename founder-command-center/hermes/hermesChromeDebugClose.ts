import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const root = process.cwd();

function main() {
  const statePath = path.join(
    root,
    "founder-command-center",
    "hermes",
    "state",
    "chrome-debug-session.json"
  );

  if (!fs.existsSync(statePath)) {
    console.log("No Chrome debug session state found.");
    process.exit(0);
  }

  const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
  const pid = String(state.pid || "").trim();

  if (!pid) {
    console.log("Chrome debug session state has no PID.");
    process.exit(0);
  }

  try {
    execFileSync("taskkill.exe", ["/PID", pid, "/T", "/F"], {
      stdio: "inherit"
    });

    fs.unlinkSync(statePath);

    console.log(`Chrome debug process closed. PID: ${pid}`);
  } catch {
    console.log(`Could not close Chrome debug process by PID: ${pid}`);
    console.log("It may already be closed.");
  }
}

main();
