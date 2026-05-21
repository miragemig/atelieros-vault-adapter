import fs from "fs";
import path from "path";

const approvedPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/approved"
);

const plansPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/execution-plans"
);

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractTitle(content: string) {
  const match = content.match(/# Build Proposal — (.+)/);

  if (!match) return "unknown-task";

  return match[1].trim();
}

function createExecutionPlan(title: string) {
  return `# Execution Plan — ${title}

## Objective

Prepare safe implementation steps for this approved proposal.

## Suggested Steps

1. Review current architecture.
2. Identify affected agents/modules.
3. Define required validations.
4. Define rollback strategy.
5. Define test strategy.
6. Implement minimal safe version first.
7. Run local validation tests.
8. Commit only after successful execution.

## Suggested Files To Review

- founder-command-center/agents
- founder-command-center/runtime
- shared/validation
- shared/governance
- shared/memory

## Risks

- Runtime instability
- Duplicate processing
- Memory corruption
- Queue inconsistency
- Ungoverned automation

## Rollback

- Revert latest Git commit
- Restore runtime state if needed

## Status

planned

## Created At

${new Date().toISOString()}
`;
}

function runExecutionPlanner() {
  const approved = fs
    .readdirSync(approvedPath)
    .filter((file) => file.endsWith(".md"));

  if (approved.length === 0) {
    console.log("No approved proposals.");
    return;
  }

  approved.forEach((file) => {
    const fullPath = path.join(approvedPath, file);

    const content = fs.readFileSync(fullPath, "utf-8");

    const title = extractTitle(content);

    const planName = `${safeFileName(title)}-execution-plan.md`;

    const planPath = path.join(plansPath, planName);

    if (fs.existsSync(planPath)) {
      console.log("Execution plan already exists:", planName);
      return;
    }

    const plan = createExecutionPlan(title);

    fs.writeFileSync(planPath, plan, "utf-8");

    console.log("Execution plan created:", planName);
  });
}

runExecutionPlanner();