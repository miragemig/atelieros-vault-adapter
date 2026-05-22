import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const quarantinePath = path.join(
  process.cwd(),
  "founder-command-center/build-system/quarantine"
);

const validationLogPath = path.join(
  process.cwd(),
  "founder-command-center/logs/validation.log"
);

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.mkdirSync(path.dirname(validationLogPath), { recursive: true });
  fs.appendFileSync(validationLogPath, line, "utf-8");
  console.log(message);
}

function getLatestDraft(): string {
  const files = fs
    .readdirSync(quarantinePath)
    .filter((file) => file.endsWith(".draft.ts"))
    .map((file) => ({
      file,
      time: fs.statSync(path.join(quarantinePath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    throw new Error("No draft files found in quarantine.");
  }

  return path.join(quarantinePath, files[0].file);
}

function stripMarkdownFences(content: string): string {
  return content
    .replace(/^```typescript\s*/i, "")
    .replace(/^```ts\s*/i, "")
    .replace(/```$/i, "")
    .split("### Safety Notes:")[0]
    .trim();
}

function validateGeneratedCode(code: string) {
  // Load task requirements from buildTask.json to determine what to validate
  const buildTaskPath = path.join(
    process.cwd(),
    "founder-command-center/runtime/buildTask.json"
  );

  let taskTitle = "unknown";
  let taskRequirements: string[] = [];

  try {
    if (fs.existsSync(buildTaskPath)) {
      const task = JSON.parse(fs.readFileSync(buildTaskPath, "utf-8"));
      taskTitle = task.title || "unknown";
      taskRequirements = task.requirements || [];
    }
  } catch {
    // fallback to generic validation
  }

  const hasConsoleLogs = code.includes("console.log(");
  const hasFileSystemWrites = code.includes("writeFile") || code.includes("appendFile");
  const hasExternalImports = /from\s+["'][^."']/.test(code) || /import\s+.*\s+from\s+["'](?!\.)/.test(code);

  // Check for function export — any task should export at least one function
  const hasExports = /export\s+(function|default|const|class)/.test(code);

  return {
    passed:
      hasExports &&
      !hasConsoleLogs &&
      !hasFileSystemWrites &&
      !hasExternalImports,
    missingExports: hasExports ? [] : ["No export found"],
    hasConsoleLogs,
    hasFileSystemWrites,
    hasExternalImports,
    normalizedExampleRisk: false
  };
}

function runValidation() {
  const draftPath = getLatestDraft();
  const raw = fs.readFileSync(draftPath, "utf-8");
  const cleanCode = stripMarkdownFences(raw);

  const cleanPath = draftPath.replace(".draft.ts", ".clean.ts");
  fs.writeFileSync(cleanPath, cleanCode, "utf-8");

  const result = validateGeneratedCode(cleanCode);

  log(`Validating: ${draftPath}`);
  log(`Clean file: ${cleanPath}`);
  log(`Result: ${result.passed ? "PASS" : "FAIL"}`);

  if (!result.passed) {
    log(`Missing exports: ${JSON.stringify(result.missingExports)}`);
    log(`Has console logs: ${result.hasConsoleLogs}`);
    log(`Has filesystem writes: ${result.hasFileSystemWrites}`);
    log(`Has external imports: ${result.hasExternalImports}`);
    log(`Suspicious repeated-token logic risk: ${result.normalizedExampleRisk}`);
    process.exit(1);
  }

  try {
    execSync(`npx tsc --noEmit --allowJs false "${cleanPath}"`, {
      stdio: "inherit"
    });
    log("TypeScript check: PASS");
  } catch {
    log("TypeScript check: FAIL");
    process.exit(1);
  }
}

runValidation();
