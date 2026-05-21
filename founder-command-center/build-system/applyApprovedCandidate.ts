import fs from "fs";
import path from "path";

const root = process.cwd();

const candidatesPath = path.join(
  root,
  "founder-command-center/build-system/approval-candidates"
);

const appliedPath = path.join(
  root,
  "founder-command-center/build-system/applied"
);

function getCandidateIdFromArgs(): string {
  const candidateId = process.argv[2];

  if (!candidateId) {
    throw new Error("Missing candidateId. Usage: npx tsx founder-command-center\\build-system\\applyApprovedCandidate.ts <candidateId>");
  }

  return candidateId;
}

function applyApprovedCandidate() {
  const candidateId = getCandidateIdFromArgs();

  const metadataPath = path.join(candidatesPath, `${candidateId}.metadata.json`);
  const candidateCodePath = path.join(candidatesPath, `${candidateId}.candidate.ts`);

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Candidate metadata not found: ${metadataPath}`);
  }

  if (!fs.existsSync(candidateCodePath)) {
    throw new Error(`Candidate code not found: ${candidateCodePath}`);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

  if (metadata.approved !== true) {
    throw new Error("Candidate is not approved. Refusing to apply.");
  }

  if (metadata.appliedToCore === true) {
    throw new Error("Candidate has already been applied. Refusing duplicate application.");
  }

  fs.mkdirSync(appliedPath, { recursive: true });

  const appliedCodePath = path.join(appliedPath, `${candidateId}.applied.ts`);

  if (fs.existsSync(appliedCodePath)) {
    throw new Error(`Applied file already exists: ${appliedCodePath}`);
  }

  fs.copyFileSync(candidateCodePath, appliedCodePath);

  metadata.appliedToCore = true;
  metadata.appliedAt = new Date().toISOString();
  metadata.appliedBy = "Miguel";
  metadata.appliedMode = "manual-explicit-cli";
  metadata.appliedToCorePath = appliedCodePath;

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");

  console.log(`Approved candidate applied to sandbox: ${appliedCodePath}`);
  console.log(`Metadata updated: ${metadataPath}`);
}

applyApprovedCandidate();
