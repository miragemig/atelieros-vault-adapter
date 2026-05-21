import fs from "fs";
import path from "path";

const plansPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/execution-plans"
);

const generatedPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/generated"
);

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function runSafeAutoBuilder() {
  const plans = fs
    .readdirSync(plansPath)
    .filter((file) => file.endsWith(".md"));

  if (plans.length === 0) {
    console.log("No execution plans found.");
    return;
  }

  for (const plan of plans) {
    const planPath = path.join(plansPath, plan);
    const content = fs.readFileSync(planPath, "utf-8");

    const titleMatch = content.match(/# Execution Plan — (.+)/);
    const title = titleMatch ? titleMatch[1].trim() : plan.replace(".md", "");

    const outputName = `${safeFileName(title)}-implementation-draft.md`;
    const outputPath = path.join(generatedPath, outputName);

    if (fs.existsSync(outputPath)) {
      console.log("Draft already exists:", outputName);
      continue;
    }

    const draft = `# Implementation Draft — ${title}

## Status

generated_safe_mode

## Source Plan

${plan}

## What this draft does

This is a safe overnight implementation draft.
It does not modify production/core files.

## Proposed Implementation

### 1. Files likely affected

- founder-command-center/agents
- founder-command-center/runtime
- shared/validation
- shared/governance
- shared/memory

### 2. Required safeguards

- validate inputs before writing
- avoid duplicate processing
- avoid destructive operations
- preserve audit trail
- require human approval for critical actions

### 3. Suggested tests

- run orchestrator
- run triage tests
- run memory governance tests
- verify build queue
- verify runtime telemetry

### 4. Manual review required

Miguel must review before applying anything to core.

## Generated At

${new Date().toISOString()}
`;

    fs.writeFileSync(outputPath, draft, "utf-8");
    console.log("Generated safe implementation draft:", outputName);
  }
}

runSafeAutoBuilder();