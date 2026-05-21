import fs from "fs";
import path from "path";

const root = process.cwd();
const filePath = path.join(root, "founder-command-center/runtime/commanderDaemon.ts");

let content = fs.readFileSync(filePath, "utf-8");

// Fix paths and shell
content = content.replace(
  /npx tsx founder-command-center\\agents\\commanderOrchestrator\.ts/g,
  "npx tsx founder-command-center/agents/commanderOrchestrator.ts"
);

content = content.replace(
  /shell: "powershell\.exe"/g,
  'shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh"'
);

fs.writeFileSync(filePath, content, "utf-8");
console.log("FIXED: founder-command-center/runtime/commanderDaemon.ts");
