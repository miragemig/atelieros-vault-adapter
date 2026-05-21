import fs from "fs";
import path from "path";

const executionPlansPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/execution-plans"
);

const generatedCodePath = path.join(
  process.cwd(),
  "founder-command-center/build-system/generated-code"
);

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractTitle(content: string) {
  const match = content.match(/# Execution Plan — (.+)/);
  return match ? match[1].trim() : "unknown-task";
}

function createCodeDraft(title: string, sourcePlan: string) {
  return `// SAFE CODE DRAFT — ${title}
// Status: generated_safe_mode
// Source plan: ${sourcePlan}
//
// IMPORTANT:
// This file is a draft only.
// It must NOT be copied into core without human review.
// It does NOT modify production files.
// Miguel must validate before implementation.

import fs from "fs";
import path from "path";

export function runDraft() {
  console.log("Safe draft for: ${title}");
  console.log("Review required before applying to core.");
}

// Suggested next step:
// 1. Review this draft.
// 2. Compare with current architecture.
// 3. Adapt manually.
// 4. Test locally.
// 5. Commit only after validation.
`;
}

function runSafeCodeDraftAgent() {
  const plans = fs
    .readdirSync(executionPlansPath)
    .filter((file) => file.endsWith(".md"));

  if (plans.length === 0) {
    console.log("No execution plans found.");
    return;
  }

  for (const plan of plans) {
    const planPath = path.join(executionPlansPath, plan);
    const content = fs.readFileSync(planPath, "utf-8");

    const title = extractTitle(content);
    const draftName = `${safeFileName(title)}-draft.ts`;
    const draftPath = path.join(generatedCodePath, draftName);

    if (fs.existsSync(draftPath)) {
      console.log("Code draft already exists:", draftName);
      continue;
    }

    fs.writeFileSync(draftPath, createCodeDraft(title, plan), "utf-8");

    console.log("Safe code draft generated:", draftName);
  }
}

runSafeCodeDraftAgent();