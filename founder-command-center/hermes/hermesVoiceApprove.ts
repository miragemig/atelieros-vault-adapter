import fs from "fs";
import path from "path";
import { evaluateVoiceEmailApproval } from "./voiceApprovalPolicy";

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

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function main() {
  const phrase = process.argv.slice(2).join(" ").trim();

  if (!phrase) {
    throw new Error('Usage: hermesVoiceApprove.ts "<approval phrase>"');
  }

  const statePath = path.join(
    root,
    "founder-command-center",
    "hermes",
    "state",
    "latest-draft-readback.json"
  );

  const state: ReadbackState | null = fs.existsSync(statePath)
    ? readJson(statePath)
    : null;

  const decision = evaluateVoiceEmailApproval(phrase, {
    readbackCompletedAt: state?.readbackCompletedAt,
    sendQuestionAskedAt: state?.sendQuestionAskedAt,
    validitySeconds: 120
  });

  const approvalsDir = path.join(
    root,
    "founder-command-center",
    "hermes",
    "approvals"
  );

  fs.mkdirSync(approvalsDir, { recursive: true });

  const id = `voice-approval-${Date.now()}`;

  const log: VoiceApprovalLog = {
    id,
    createdAt: new Date().toISOString(),
    phrase,
    allowed: decision.allowed,
    reason: decision.reason,
    approvalType: decision.approvalType,
    draftPath: state?.draftPath,
    to: state?.to,
    subject: state?.subject,
    status: decision.allowed ? "approved_not_sent" : "rejected"
  };

  const outputPath = path.join(approvalsDir, `${id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(log, null, 2), "utf-8");

  console.log(JSON.stringify(log, null, 2));

  if (!decision.allowed) {
    process.exit(2);
  }

  console.log("");
  console.log("Voice approval accepted.");
  console.log("No email was sent.");
  console.log("Next step: browser-send-gate can use this approval later.");
}

main();
