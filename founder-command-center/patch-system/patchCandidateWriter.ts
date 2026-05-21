import fs from "fs";
import path from "path";
import { PatchCandidateMetadata, SurgicalPatchTask } from "./patchTaskTypes";

export type WritePatchCandidateInput = {
  root: string;
  task: SurgicalPatchTask;
  beforeContent: string;
  afterContent: string;
  diff: string;
  validationSummary: string;
};

export function writePatchCandidate(input: WritePatchCandidateInput): string {
  const timestamp = Date.now();
  const candidateId = `${input.task.id}-${timestamp}`;

  const candidateDir = path.join(
    input.root,
    "founder-command-center",
    "patch-system",
    "patch-candidates",
    candidateId
  );

  fs.mkdirSync(candidateDir, { recursive: true });

  const metadata: PatchCandidateMetadata = {
    candidateId,
    taskId: input.task.id,
    title: input.task.title,
    createdAt: new Date().toISOString(),
    targetFiles: input.task.targetFiles,
    status: "waiting_review",
    approvalRequired: true,
    forbiddenActions: input.task.forbiddenActions,
    summary:
      "Patch candidate prepared only. It has not been applied to the working tree."
  };

  fs.writeFileSync(
    path.join(candidateDir, "metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf-8"
  );

  fs.writeFileSync(path.join(candidateDir, "before.ts"), input.beforeContent, "utf-8");
  fs.writeFileSync(path.join(candidateDir, "after.ts"), input.afterContent, "utf-8");
  fs.writeFileSync(path.join(candidateDir, "patch.diff"), input.diff, "utf-8");

  fs.writeFileSync(
    path.join(candidateDir, "VALIDATION.md"),
    [
      `# Validation — ${input.task.title}`,
      "",
      "## Status",
      "waiting_review",
      "",
      "## Approval",
      "Miguel approval required before apply.",
      "",
      "## Validation summary",
      input.validationSummary,
      "",
      "## Forbidden actions",
      ...input.task.forbiddenActions.map((action) => `- ${action}`)
    ].join("\n"),
    "utf-8"
  );

  return candidateDir;
}
