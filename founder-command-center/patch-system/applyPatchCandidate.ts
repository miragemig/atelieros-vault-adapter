import fs from "fs";
import path from "path";
import { evaluateCapabilityAction } from "../capabilities/capabilityPolicy";

const root = process.cwd();

type PatchCandidateMetadata = {
  candidateId: string;
  taskId: string;
  title: string;
  createdAt: string;
  targetFiles: string[];
  status: "waiting_review" | "applied" | "rejected" | string;
  approvalRequired: boolean;
  forbiddenActions: string[];
  summary: string;
  approvedBy?: string;
  appliedAt?: string;
};

function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf-8");
}

function getCandidateDir(candidateIdOrPath: string): string {
  if (path.isAbsolute(candidateIdOrPath)) {
    return candidateIdOrPath;
  }

  return path.join(
    root,
    "founder-command-center",
    "patch-system",
    "patch-candidates",
    candidateIdOrPath
  );
}

function parseApprovedBy(args: string[]): string | null {
  const index = args.indexOf("--approved-by");

  if (index === -1) {
    return null;
  }

  return args[index + 1] || null;
}

function assertCleanApproval(approvedBy: string | null): void {
  if (approvedBy !== "Miguel") {
    throw new Error(
      'Patch apply blocked. Explicit approval is required: --approved-by Miguel'
    );
  }
}

function applyPatchCandidate(candidateIdOrPath: string, approvedBy: string | null): string {
  assertCleanApproval(approvedBy);

  const capabilityDecision = evaluateCapabilityAction(
    "surgical_patch_worker",
    "apply_patch"
  );

  if (!capabilityDecision.requiresApproval) {
    throw new Error("Unsafe policy: apply_patch must require Miguel approval.");
  }

  const candidateDir = getCandidateDir(candidateIdOrPath);

  const metadataPath = path.join(candidateDir, "metadata.json");
  const beforePath = path.join(candidateDir, "before.ts");
  const afterPath = path.join(candidateDir, "after.ts");

  if (!fs.existsSync(candidateDir)) {
    throw new Error(`Candidate directory not found: ${candidateDir}`);
  }

  if (!fs.existsSync(metadataPath)) {
    throw new Error("metadata.json missing.");
  }

  if (!fs.existsSync(beforePath)) {
    throw new Error("before.ts missing.");
  }

  if (!fs.existsSync(afterPath)) {
    throw new Error("after.ts missing.");
  }

  const metadata = JSON.parse(readText(metadataPath)) as PatchCandidateMetadata;

  if (metadata.status !== "waiting_review") {
    throw new Error(`Candidate is not waiting_review. Current status: ${metadata.status}`);
  }

  if (metadata.approvalRequired !== true) {
    throw new Error("Candidate metadata does not require approval. Blocked.");
  }

  if (!Array.isArray(metadata.targetFiles) || metadata.targetFiles.length !== 1) {
    throw new Error("v0.1 apply supports exactly one target file.");
  }

  const targetRelativePath = metadata.targetFiles[0];
  const targetPath = path.join(root, targetRelativePath);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Target file not found: ${targetRelativePath}`);
  }

  const currentContent = readText(targetPath);
  const beforeContent = readText(beforePath);
  const afterContent = readText(afterPath);

  if (currentContent !== beforeContent) {
    throw new Error(
      [
        "Patch apply blocked.",
        "The current target file no longer matches before.ts.",
        "This candidate is stale or the file changed after candidate creation."
      ].join(" ")
    );
  }

  if (beforeContent === afterContent) {
    throw new Error("Patch apply blocked. before.ts and after.ts are identical.");
  }

  fs.writeFileSync(targetPath, afterContent, "utf-8");

  const updatedMetadata: PatchCandidateMetadata = {
    ...metadata,
    status: "applied",
    approvedBy: "Miguel",
    appliedAt: new Date().toISOString(),
    summary:
      "Patch applied to working tree after explicit Miguel approval. Git commit/push not performed."
  };

  writeJson(metadataPath, updatedMetadata);

  return [
    `Patch applied: ${metadata.candidateId}`,
    `Target file: ${targetRelativePath}`,
    "Git commit/push not performed."
  ].join("\n");
}

function main() {
  const candidateArg = process.argv[2];

  if (!candidateArg) {
    throw new Error(
      "Usage: applyPatchCandidate.ts <candidate-id-or-path> --approved-by Miguel"
    );
  }

  const approvedBy = parseApprovedBy(process.argv.slice(3));
  const result = applyPatchCandidate(candidateArg, approvedBy);

  console.log(result);
}

main();
