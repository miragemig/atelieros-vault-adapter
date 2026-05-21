import fs from "fs";
import path from "path";

const proposalsPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/proposals"
);

const approvedPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/approved"
);

function runApprovalGate() {
  const proposals = fs
    .readdirSync(proposalsPath)
    .filter((file) => file.endsWith(".md"));

  if (proposals.length === 0) {
    console.log("No proposals waiting for approval.");
    return;
  }

  console.log("\n=== BUILD PROPOSALS WAITING APPROVAL ===\n");

  proposals.forEach((proposal, index) => {
    console.log(`${index + 1}. ${proposal}`);
  });

  console.log("\nTo approve:");
  console.log("Move proposal manually to /approved");
}

function showApproved() {
  const approved = fs
    .readdirSync(approvedPath)
    .filter((file) => file.endsWith(".md"));

  console.log("\n=== APPROVED PROPOSALS ===\n");

  if (approved.length === 0) {
    console.log("No approved proposals.");
    return;
  }

  approved.forEach((proposal, index) => {
    console.log(`${index + 1}. ${proposal}`);
  });
}

runApprovalGate();
showApproved();