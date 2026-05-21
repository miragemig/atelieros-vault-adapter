import fs from "fs";
import path from "path";

const roadmapPath = path.join(
  process.cwd(),
  "founder-command-center/roadmap/roadmap.json"
);

const generatedCodePath = path.join(
  process.cwd(),
  "founder-command-center/build-system/generated-code"
);

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFunctionName(value: string) {
  const base = safeFileName(value).replace(/-/g, "_");

  if (!base) return "roadmap_draft_task";

  if (/^[0-9]/.test(base)) {
    return `task_${base}`;
  }

  return base;
}

function loadRoadmap() {
  return JSON.parse(fs.readFileSync(roadmapPath, "utf-8"));
}

function ensureGeneratedCodeFolder() {
  if (!fs.existsSync(generatedCodePath)) {
    fs.mkdirSync(generatedCodePath, { recursive: true });
  }
}

function createDraft(task: any, phase: any) {
  const functionName = safeFunctionName(task.title);

  return `// ROADMAP CODE DRAFT
// Task: ${task.title}
// Phase: ${phase.name}
// Priority: ${task.priority}
//
// GENERATED IN SAFE MODE
// NOT APPLIED TO CORE
// HUMAN REVIEW REQUIRED

export function ${functionName}() {
  console.log("Roadmap draft executing: ${task.title}");
}

/*
Suggested architecture:

Task:
${task.title}

Description:
${task.description ?? "No description"}

Suggested next implementation steps:
1. Review current architecture.
2. Identify affected modules.
3. Add governance validation.
4. Add tests.
5. Implement minimal safe version first.
6. Validate before merge.

Suggested folders:
- founder-command-center/agents
- founder-command-center/runtime
- shared/governance
- shared/validation
- shared/memory

Safety:
- do not modify core automatically
- require approval before merge
- preserve audit trail
*/
`;
}

function runRoadmapCodeDraftAgent() {
  ensureGeneratedCodeFolder();

  const roadmap = loadRoadmap();
  const phases = roadmap.phases ?? [];

  let generated = 0;

  for (const phase of phases) {
    const tasks = phase.tasks ?? [];

    for (const task of tasks) {
      if (task.status !== "todo" && task.status !== "active") {
        continue;
      }

      if (!task.title) {
        continue;
      }

      const fileName = `${safeFileName(task.title)}-roadmap-draft.ts`;
      const filePath = path.join(generatedCodePath, fileName);

      if (fs.existsSync(filePath)) {
        console.log("Roadmap draft already exists:", fileName);
        continue;
      }

      const content = createDraft(task, phase);

      fs.writeFileSync(filePath, content, "utf-8");

      generated++;
      console.log("Generated roadmap draft:", fileName);
    }
  }

  console.log(`Total roadmap drafts generated: ${generated}`);
}

runRoadmapCodeDraftAgent();