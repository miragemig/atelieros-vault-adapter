import fs from "fs";
import path from "path";

const roadmapPath = path.join(
  process.cwd(),
  "founder-command-center/roadmap/roadmap.json"
);

const proposalsPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/proposals"
);

function loadRoadmap() {
  return JSON.parse(fs.readFileSync(roadmapPath, "utf-8"));
}

function getNextTask() {
  const roadmap = loadRoadmap();

  const activePhase = roadmap.phases.find(
    (phase: any) => phase.status === "active"
  );

  if (!activePhase) return null;

  const nextTask = activePhase.tasks.find(
    (task: any) => task.status === "active" || task.status === "todo"
  );

  if (!nextTask) return null;

  return {
    phase: activePhase.name,
    task: nextTask
  };
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function runBuildAgent() {
  const next = getNextTask();

  if (!next) {
    console.log("No build task found.");
    return;
  }

  const fileName = `${safeFileName(next.task.title)}.md`;
  const filePath = path.join(proposalsPath, fileName);

  if (fs.existsSync(filePath)) {
    console.log("Build proposal already exists:", fileName);
    return;
  }

  const content = `# Build Proposal — ${next.task.title}

## Phase

${next.phase}

## Task

${next.task.title}

## Priority

${next.task.priority}

## Objective

Implement this task as part of the governed Founder Command Center / AtelierOS runtime.

## Proposed Approach

1. Define the minimal safe implementation.
2. Avoid uncontrolled automation.
3. Add validation where needed.
4. Add governance checks where needed.
5. Test with local sample data.
6. Commit changes after successful test.

## Safety Rules

- Do not delete files automatically.
- Do not send emails.
- Do not deploy.
- Do not modify critical memory without approval.
- Prefer dry-run behavior first.

## Status

suggested

## Created At

${new Date().toISOString()}
`;

  fs.writeFileSync(filePath, content, "utf-8");

  console.log("Build proposal created:", filePath);
}

runBuildAgent();