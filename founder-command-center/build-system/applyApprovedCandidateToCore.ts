import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();

const candidatesPath = path.join(
  root,
  "founder-command-center/build-system/approval-candidates"
);

const backupsPath = path.join(
  root,
  "founder-command-center/build-system/core-backups"
);

function getArgs() {
  const candidateId = process.argv[2];
  const destinationPathArg = process.argv[3];
  const mode = process.argv[4];
  const autonomous =
    process.argv.includes("--autonomous") ||
    process.env.ZEUS_AUTONOMOUS_CONSTRUCTION === "true";

  if (!candidateId || !destinationPathArg || !mode) {
    throw new Error(
      "Usage: npx tsx founder-command-center\\build-system\\applyApprovedCandidateToCore.ts <candidateId> <destinationPath> --dry-run|--apply"
    );
  }

  if (mode !== "--dry-run" && mode !== "--apply") {
    throw new Error("Mode must be either --dry-run or --apply.");
  }

  return {
    candidateId,
    destinationPath: path.resolve(root, destinationPathArg),
    dryRun: mode === "--dry-run",
    apply: mode === "--apply",
    autonomous
  };
}

function getGitStatus(): string {
  try {
    return execSync("git status --short", {
      cwd: root,
      encoding: "utf-8"
    });
  } catch {
    return "";
  }
}

function ensureInsideRepo(targetPath: string) {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(targetPath);

  if (!normalizedTarget.startsWith(normalizedRoot)) {
    throw new Error("Destination path must be inside the repository.");
  }
}

function applyApprovedCandidateToCore() {
  const { candidateId, destinationPath, dryRun, autonomous } = getArgs();

  ensureInsideRepo(destinationPath);

  const metadataPath = path.join(
    candidatesPath,
    `${candidateId}.metadata.json`
  );

  const candidateCodePath = path.join(
    candidatesPath,
    `${candidateId}.candidate.ts`
  );

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Candidate metadata not found: ${metadataPath}`);
  }

  if (!fs.existsSync(candidateCodePath)) {
    throw new Error(`Candidate code not found: ${candidateCodePath}`);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

  if (metadata.approved !== true) {
    throw new Error("Candidate is not approved. Refusing to apply to core.");
  }

  if (metadata.appliedToCoreReal === true) {
    throw new Error("Candidate has already been applied to core real. Refusing duplicate application.");
  }

  const gitStatus = getGitStatus();

  if (!autonomous && gitStatus.trim().length > 0) {
    throw new Error(
      [
        "Git working tree is not clean. Refusing core apply.",
        "",
        gitStatus
      ].join("\n")
    );
  }

  const destinationDir = path.dirname(destinationPath);
  const destinationExists = fs.existsSync(destinationPath);

  const backupPath = path.join(
    backupsPath,
    `${candidateId}-${Date.now()}.backup.ts`
  );

  console.log("=== CORE APPLY PLAN ===");
  console.log(`Candidate: ${candidateId}`);
  console.log(`Source: ${candidateCodePath}`);
  console.log(`Destination: ${destinationPath}`);
  console.log(`Destination exists: ${destinationExists}`);
  console.log(`Backup path: ${destinationExists ? backupPath : "not needed"}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "APPLY"}`);

  if (dryRun) {
    console.log("Dry run only. No files changed.");
    return;
  }

  fs.mkdirSync(destinationDir, { recursive: true });

  if (destinationExists) {
    fs.mkdirSync(backupsPath, { recursive: true });
    fs.copyFileSync(destinationPath, backupPath);
  }

  fs.copyFileSync(candidateCodePath, destinationPath);

  metadata.appliedToCoreReal = true;
  metadata.appliedToCoreRealAt = new Date().toISOString();
  metadata.appliedToCoreRealBy = autonomous ? "ZEUS" : "Miguel";
  metadata.appliedToCoreRealMode = autonomous ? "autonomous-overnight" : "manual-explicit-cli";
  metadata.appliedToCoreRealPath = destinationPath;
  metadata.backupPath = destinationExists ? backupPath : null;

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");

  console.log("Candidate applied to core destination.");
  console.log("Run git diff before committing.");
}

applyApprovedCandidateToCore();
