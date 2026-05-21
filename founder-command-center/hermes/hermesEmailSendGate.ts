import fs from "fs";
import path from "path";

const root = process.cwd();

type SendRequest = {
  id: string;
  createdAt: string;
  approvedBy: "Miguel";
  status: "approved_for_bridge_not_sent";
  draftPath: string;
  realSendBlocked: true;
  reason: string;
};

function latestDraft(): string | null {
  const draftsDir = path.join(root, "founder-command-center", "hermes", "drafts");

  if (!fs.existsSync(draftsDir)) return null;

  const drafts = fs
    .readdirSync(draftsDir)
    .filter((file) => file.endsWith(".draft.md"))
    .map((file) => ({
      file,
      fullPath: path.join(draftsDir, file),
      time: fs.statSync(path.join(draftsDir, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  return drafts[0]?.fullPath || null;
}

function parseApprovedBy(args: string[]): string | null {
  const index = args.indexOf("--approved-by");
  return index >= 0 ? args[index + 1] || null : null;
}

function main() {
  const approvedBy = parseApprovedBy(process.argv.slice(2));

  if (approvedBy !== "Miguel") {
    throw new Error("Email send blocked. Explicit approval required: --approved-by Miguel");
  }

  const draftPath = latestDraft();

  if (!draftPath) {
    throw new Error("No Hermes draft found to prepare for send.");
  }

  const draftContent = fs.readFileSync(draftPath, "utf-8");

  if (!draftContent.includes("Draft only. Not sent.")) {
    throw new Error("Draft safety marker missing. Refusing send request.");
  }

  const outboxDir = path.join(root, "founder-command-center", "hermes", "outbox");
  fs.mkdirSync(outboxDir, { recursive: true });

  const id = `send-request-${Date.now()}`;

  const request: SendRequest = {
    id,
    createdAt: new Date().toISOString(),
    approvedBy: "Miguel",
    status: "approved_for_bridge_not_sent",
    draftPath,
    realSendBlocked: true,
    reason:
      "Gmail send bridge is not implemented yet. This records approval intent but does not send email."
  };

  const outputPath = path.join(outboxDir, `${id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(request, null, 2), "utf-8");

  console.log(`Email send request created: ${outputPath}`);
  console.log("Real Gmail send: BLOCKED until Gmail bridge is implemented.");
}

main();
