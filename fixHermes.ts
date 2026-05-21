import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();

// Ficheiros críticos com problemas
const criticalFiles = [
  "founder-command-center/hermes/hermesBrowserControlPreflight.ts",
  "founder-command-center/hermes/hermesBrowserSendClickAdapter.ts",
  "founder-command-center/hermes/hermesBrowserSendGate.ts",
  "founder-command-center/hermes/hermesBrowserSendNow.ts"
];

function fixFile(filePath: string) {
  const fullPath = path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${filePath} not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf-8");
  const originalContent = content;

  // 1. Fix command paths
  content = content.replace(
    /npx tsx founder-command-center\\\\hermes\\\\/g,
    "npx tsx founder-command-center/hermes/"
  );

  // 2. Fix node_modules bin paths
  content = content.replace(/\\.\\\\node_modules\\\\.bin\\\\/g, "./node_modules/.bin/");
  content = content.replace(/node_modules\\\\.bin\\\\/g, "node_modules/.bin/");

  // 3. Fix hardcoded paths in runTs calls
  content = content.replace(
    /runTs\("founder-command-center\\\\/g,
    'runTs("founder-command-center/'
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, "utf-8");
    console.log(`FIXED: ${filePath}`);
  } else {
    console.log(`OK: ${filePath}`);
  }
}

console.log("Fixing critical Hermes files...\n");
criticalFiles.forEach(fixFile);
console.log("\n✓ Hermes Windows compatibility fixed");
