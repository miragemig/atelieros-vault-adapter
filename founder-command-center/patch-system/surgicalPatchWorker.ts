import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { writePatchCandidate } from "./patchCandidateWriter";
import { SurgicalPatchTask } from "./patchTaskTypes";

const root = process.cwd();

function safeExec(command: string): string {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch (error: any) {
    const stdout = error?.stdout?.toString?.() || "";
    const stderr = error?.stderr?.toString?.() || "";
    return [stdout, stderr].filter(Boolean).join("\n").trim();
  }
}

function simpleLineDiff(before: string, after: string): string {
  const original =
    "  const risks = risksFor(routed.intent, context.gitStatus).map((item) => `- ${item}`).join(\"\\n\");";

  const replacement = [
    "  const risks = risksFor(routed.intent, context.gitStatus)",
    "    .map((item) => `- ${item}`)",
    "    .join(\"\\n\");"
  ].join("\n");

  if (before.includes(original) && after.includes(replacement)) {
    return [
      "--- founder-command-center/chat/zeusAdvisor.ts",
      "+++ founder-command-center/chat/zeusAdvisor.ts",
      "",
      `- ${original}`,
      ...replacement.split("\n").map((line) => `+ ${line}`)
    ].join("\n");
  }

  return [
    "--- before",
    "+++ after",
    "Unable to generate focused diff for this candidate."
  ].join("\n");
}

function createRiskFormattingCandidate(source: string): string {
  const original = `  const risks = risksFor(routed.intent, context.gitStatus).map((item) => \`- \${item}\`).join("\\n");`;

  const replacement = [
    "  const risks = risksFor(routed.intent, context.gitStatus)",
    "    .map((item) => `- ${item}`)",
    "    .join(\"\\n\");"
  ].join("\n");

  if (!source.includes(original)) {
    throw new Error(
      "Expected risk formatting line was not found. Refusing to create blind patch."
    );
  }

  return source.replace(original, replacement);
}

function validateCandidate(task: SurgicalPatchTask, afterContent: string): string {
  const checks: string[] = [];

  if (task.id === "fix-zeus-risk-formatting") {
    checks.push(
      afterContent.includes(".join(\"\\n\");")
        ? "PASS: candidate keeps explicit newline join for risks."
        : "FAIL: candidate does not include explicit newline join for risks."
    );

    checks.push(
      afterContent.includes("const risks = risksFor(routed.intent, context.gitStatus)\n    .map")
        ? "PASS: risk rendering is expanded into multiline expression for readability."
        : "FAIL: risk rendering was not expanded as expected."
    );
  }

  const failed = checks.some((check) => check.startsWith("FAIL"));

  return [
    failed ? "RESULT: FAIL" : "RESULT: PASS",
    "",
    ...checks
  ].join("\n");
}

export function runSurgicalPatchWorker(task: SurgicalPatchTask): string {
  if (task.approvalRequired !== true) {
    throw new Error("Surgical patch tasks must require approval.");
  }

  if (task.targetFiles.length !== 1) {
    throw new Error("v0.1 supports exactly one target file.");
  }

  const targetRelativePath = task.targetFiles[0];
  const targetPath = path.join(root, targetRelativePath);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Target file not found: ${targetRelativePath}`);
  }

  const beforeContent = fs.readFileSync(targetPath, "utf-8");

  const reproductionBefore = safeExec(task.reproductionCommand);

  let afterContent: string;

  if (task.id === "fix-zeus-risk-formatting") {
    afterContent = createRiskFormattingCandidate(beforeContent);
  } else {
    throw new Error(`Unsupported surgical patch task in v0.1: ${task.id}`);
  }

  if (afterContent === beforeContent) {
    throw new Error("Patch candidate did not change content. Refusing empty candidate.");
  }

  const diff = simpleLineDiff(beforeContent, afterContent);
  const validationSummary = [
    validateCandidate(task, afterContent),
    "",
    "## Reproduction command before candidate",
    "```text",
    reproductionBefore || "(no output)",
    "```",
    "",
    "NOTE: Candidate was not applied to the working tree. Runtime validation after apply is approval-gated."
  ].join("\n");

  return writePatchCandidate({
    root,
    task,
    beforeContent,
    afterContent,
    diff,
    validationSummary
  });
}

function main() {
  const taskPath = process.argv[2];

  if (!taskPath) {
    throw new Error("Usage: surgicalPatchWorker.ts <patch-task.json>");
  }

  const absoluteTaskPath = path.isAbsolute(taskPath)
    ? taskPath
    : path.join(root, taskPath);

  const task = JSON.parse(fs.readFileSync(absoluteTaskPath, "utf-8")) as SurgicalPatchTask;
  const candidateDir = runSurgicalPatchWorker(task);

  console.log(`Patch candidate created: ${candidateDir}`);
}

main();

