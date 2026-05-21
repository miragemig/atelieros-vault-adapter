import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();

const filesToFix = [
  "founder-command-center/agents/commanderOrchestrator.ts",
  "founder-command-center/agents/commanderDaemon.ts",
  "founder-command-center/ui/zeusConsoleServer.ts",
  "founder-command-center/zeus/zeusOvernightSelfBuild.ts"
];

function fixWindowsDependencies(filePath: string) {
  const fullPath = path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${filePath} not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf-8");
  const originalContent = content;

  // 1. Replace backslashes in npx tsx commands with forward slashes
  content = content.replace(/npx tsx ([^"\n]*)\\\\/g, "npx tsx $1/");
  content = content.replace(/founder-command-center\\\\/g, "founder-command-center/");
  
  // 2. Replace hardcoded "powershell.exe" with conditional shell selection
  content = content.replace(
    /shell:\s*"powershell\.exe"/g,
    'shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh"'
  );

  // 3. Replace shell: "powershell.exe" with conditional
  content = content.replace(
    /shell:\s*'powershell\.exe'/g,
    'shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh"'
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, "utf-8");
    console.log(`FIXED: ${filePath}`);
  } else {
    console.log(`OK: ${filePath} (no changes needed)`);
  }
}

console.log("Fixing Windows dependencies...\n");
filesToFix.forEach(fixWindowsDependencies);

console.log("\n✓ Windows dependency cleanup complete");
console.log("\nRun: git diff to review changes");
