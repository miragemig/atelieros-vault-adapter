import fs from "fs";
import path from "path";
import { evaluateCapabilityAction } from "../capabilities/capabilityPolicy";

const root = process.cwd();

type PatchCandidateStatus =
  | "safe_to_review"
  | "blocked"
  | "stale"
  | "invalid";

type PatchCandidateReview = {
  candidateId: string;
  status: PatchCandidateStatus;
  targetFiles: string[];
  approvalRequired: boolean;
  checks: string[];
  risks: string[];
  recommendation: string;
};

function readText(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
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

function reviewPatchCandidate(candidateIdOrPath: string): PatchCandidateReview {
  const candidateDir = getCandidateDir(candidateIdOrPath);

  const metadataPath = path.join(candidateDir, "metadata.json");
  const diffPath = path.join(candidateDir, "patch.diff");
  const validationPath = path.join(candidateDir, "VALIDATION.md");
  const beforePath = path.join(candidateDir, "before.ts");
  const afterPath = path.join(candidateDir, "after.ts");

  const checks: string[] = [];
  const risks: string[] = [];

  if (!fs.existsSync(candidateDir)) {
    return {
      candidateId: candidateIdOrPath,
      status: "invalid",
      targetFiles: [],
      approvalRequired: true,
      checks: ["FAIL: candidate directory does not exist."],
      risks: ["Candidate cannot be reviewed."],
      recommendation: "Block. Candidate directory missing."
    };
  }

  if (!fs.existsSync(metadataPath)) {
    return {
      candidateId: candidateIdOrPath,
      status: "invalid",
      targetFiles: [],
      approvalRequired: true,
      checks: ["FAIL: metadata.json missing."],
      risks: ["Candidate has no metadata."],
      recommendation: "Block. Metadata is required."
    };
  }

  const metadata = JSON.parse(readText(metadataPath));

  const diff = readText(diffPath);
  const validation = readText(validationPath);
  const beforeContent = readText(beforePath);
  const afterContent = readText(afterPath);

  checks.push(fs.existsSync(diffPath) ? "PASS: patch.diff exists." : "FAIL: patch.diff missing.");
  checks.push(fs.existsSync(validationPath) ? "PASS: VALIDATION.md exists." : "FAIL: VALIDATION.md missing.");
  checks.push(fs.existsSync(beforePath) ? "PASS: before.ts exists." : "FAIL: before.ts missing.");
  checks.push(fs.existsSync(afterPath) ? "PASS: after.ts exists." : "FAIL: after.ts missing.");

  if (metadata.approvalRequired === true) {
    checks.push("PASS: approvalRequired is true.");
  } else {
    checks.push("FAIL: approvalRequired is not true.");
    risks.push("Candidate could bypass Miguel approval.");
  }

  if (metadata.status === "waiting_review") {
    checks.push("PASS: candidate status is waiting_review.");
  } else {
    checks.push(`WARN: candidate status is ${metadata.status}.`);
  }

  if (!Array.isArray(metadata.targetFiles) || metadata.targetFiles.length === 0) {
    checks.push("FAIL: no target files declared.");
    risks.push("Candidate has no explicit target file.");
  }

  if (beforeContent && afterContent && beforeContent === afterContent) {
    checks.push("FAIL: before.ts and after.ts are identical.");
    risks.push("Candidate makes no effective change.");
  }

  if (!diff.trim()) {
    checks.push("FAIL: patch.diff is empty.");
    risks.push("Candidate has no reviewable diff.");
  }

  if (diff.includes("Unable to generate focused diff")) {
    checks.push("FAIL: focused diff was not generated.");
    risks.push("Candidate is hard to review.");
  }

  if (validation.includes("RESULT: FAIL")) {
    checks.push("FAIL: validation summary reports failure.");
    risks.push("Validation failed.");
  }

  if (validation.includes("RESULT: PASS")) {
    checks.push("PASS: validation summary reports pass.");
  } else {
    checks.push("WARN: validation result not found.");
  }

  const applyDecision = evaluateCapabilityAction("surgical_patch_worker", "apply_patch");

  if (applyDecision.requiresApproval) {
    checks.push("PASS: apply_patch requires Miguel approval.");
  } else {
    checks.push("FAIL: apply_patch does not require approval.");
    risks.push("Action policy is unsafe.");
  }

  const hasFail = checks.some((check) => check.startsWith("FAIL"));
  const hasCriticalRisk = risks.length > 0;

  let status: PatchCandidateStatus = "safe_to_review";
  let recommendation =
    "Safe to review only. Do not apply without explicit Miguel approval.";

  if (hasFail || hasCriticalRisk) {
    status = "blocked";
    recommendation = "Block. Candidate needs revision before review/apply.";
  }

  return {
    candidateId: metadata.candidateId || path.basename(candidateDir),
    status,
    targetFiles: metadata.targetFiles || [],
    approvalRequired: metadata.approvalRequired === true,
    checks,
    risks,
    recommendation
  };
}

function main() {
  const candidateArg = process.argv[2];

  if (!candidateArg) {
    throw new Error("Usage: reviewPatchCandidate.ts <candidate-id-or-path>");
  }

  const review = reviewPatchCandidate(candidateArg);

  console.log(JSON.stringify(review, null, 2));
}

main();
