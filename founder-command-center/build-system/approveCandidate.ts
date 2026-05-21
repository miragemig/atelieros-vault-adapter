import fs from "fs";
import path from "path";

const root = process.cwd();

const candidatesPath = path.join(
  root,
  "founder-command-center/build-system/approval-candidates"
);

function getCandidateIdFromArgs(): string {
  const candidateId = process.argv[2];

  if (!candidateId) {
    throw new Error("Missing candidateId. Usage: npx tsx founder-command-center\\build-system\\approveCandidate.ts <candidateId>");
  }

  return candidateId;
}

function isAutonomousMode(): boolean {
  return process.argv.includes("--autonomous") || process.env.ZEUS_AUTONOMOUS_CONSTRUCTION === "true";
}

function approveCandidate() {
  const candidateId = getCandidateIdFromArgs();
  const metadataPath = path.join(candidatesPath, `${candidateId}.metadata.json`);

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Candidate metadata not found: ${metadataPath}`);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

  if (metadata.approved === true) {
    console.log(`Candidate already approved: ${candidateId}`);
    return;
  }

  if (metadata.requiresHumanApproval !== true) {
    throw new Error("Candidate metadata is invalid: requiresHumanApproval must be true.");
  }

  if (metadata.appliedToCore === true) {
    throw new Error("Candidate has already been applied to core. Refusing to approve stale candidate.");
  }

  metadata.approved = true;
  metadata.approvedAt = new Date().toISOString();
  metadata.approvedBy = isAutonomousMode() ? "ZEUS" : "Miguel";
  metadata.approvalMode = isAutonomousMode() ? "autonomous-overnight" : "manual-explicit-cli";

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");

  console.log(`Candidate approved: ${candidateId}`);
  console.log(`Metadata updated: ${metadataPath}`);
}

approveCandidate();
