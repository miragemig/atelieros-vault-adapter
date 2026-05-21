import fs from "fs";
import path from "path";

const root = process.cwd();

type ReadbackState = {
  draftPath: string;
  to: string;
  subject: string;
  readbackCompletedAt: string;
  sendQuestionAskedAt: string;
  prompt: string;
  status: "awaiting_voice_approval";
};

type VoiceApprovalLog = {
  id: string;
  createdAt: string;
  phrase: string;
  allowed: boolean;
  reason: string;
  approvalType: string;
  draftPath?: string;
  to?: string;
  subject?: string;
  status: "approved_not_sent" | "rejected";
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function ageSeconds(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
}

function latestApproval(): VoiceApprovalLog | null {
  const approvalsDir = path.join(root, "founder-command-center", "hermes", "approvals");

  if (!fs.existsSync(approvalsDir)) return null;

  const files = fs
    .readdirSync(approvalsDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({
      file,
      fullPath: path.join(approvalsDir, file),
      time: fs.statSync(path.join(approvalsDir, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  if (!files[0]) return null;

  return readJson<VoiceApprovalLog>(files[0].fullPath);
}

function main() {
  const validitySeconds = 120;
  const reasons: string[] = [];

  const readbackPath = path.join(
    root,
    "founder-command-center",
    "hermes",
    "state",
    "latest-draft-readback.json"
  );

  const readback = fs.existsSync(readbackPath)
    ? readJson<ReadbackState>(readbackPath)
    : null;

  const approval = latestApproval();

  if (!readback) {
    reasons.push("Missing latest draft readback state.");
  }

  if (!approval) {
    reasons.push("Missing voice approval log.");
  }

  if (readback) {
    const readbackAge = ageSeconds(readback.readbackCompletedAt);

    if (readbackAge < 0 || readbackAge > validitySeconds) {
      reasons.push(`Draft readback expired. Age seconds: ${readbackAge}.`);
    }

    if (!fs.existsSync(readback.draftPath)) {
      reasons.push("Draft file referenced by readback no longer exists.");
    }
  }

  if (approval) {
    const approvalAge = ageSeconds(approval.createdAt);

    if (!approval.allowed || approval.status !== "approved_not_sent") {
      reasons.push("Latest voice approval is not accepted.");
    }

    if (approvalAge < 0 || approvalAge > validitySeconds) {
      reasons.push(`Voice approval expired. Age seconds: ${approvalAge}.`);
    }
  }

  if (readback && approval) {
    if (readback.draftPath !== approval.draftPath) {
      reasons.push("Approval draftPath does not match readback draftPath.");
    }

    if (readback.to !== approval.to) {
      reasons.push("Approval recipient does not match readback recipient.");
    }

    if (readback.subject !== approval.subject) {
      reasons.push("Approval subject does not match readback subject.");
    }
  }

  const result = {
    status: reasons.length === 0 ? "READY_TO_SEND_MANUALLY" : "BLOCKED",
    reasons,
    readback: readback
      ? {
          draftPath: readback.draftPath,
          to: readback.to,
          subject: readback.subject,
          ageSeconds: ageSeconds(readback.readbackCompletedAt)
        }
      : undefined,
    approval: approval
      ? {
          id: approval.id,
          phrase: approval.phrase,
          approvalType: approval.approvalType,
          ageSeconds: ageSeconds(approval.createdAt)
        }
      : undefined
  };

  console.log(JSON.stringify(result, null, 2));

  if (result.status === "BLOCKED") {
    process.exit(2);
  }
}

main();
