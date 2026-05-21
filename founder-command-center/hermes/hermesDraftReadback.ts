import fs from "fs";
import path from "path";

const root = process.cwd();

type ParsedDraft = {
  draftPath: string;
  to: string;
  subject: string;
  body: string;
  safetyMarkerPresent: boolean;
};

type DraftReadbackState = {
  draftPath: string;
  to: string;
  subject: string;
  readbackCompletedAt: string;
  sendQuestionAskedAt: string;
  prompt: string;
  status: "awaiting_voice_approval";
};

function latestValidDraft(): string | null {
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

  for (const draft of drafts) {
    const content = fs.readFileSync(draft.fullPath, "utf-8");

    if (
      content.includes("## To") &&
      content.includes("## Proposed reply") &&
      content.includes("Draft only. Not sent.")
    ) {
      return draft.fullPath;
    }
  }

  return null;
}

function section(content: string, heading: string): string {
  const normalized = content.replace(/\r\n/g, "\n");
  const pattern = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "m");
  const match = normalized.match(pattern);
  return match?.[1]?.trim() || "";
}

function parseDraft(draftPath: string): ParsedDraft {
  const content = fs.readFileSync(draftPath, "utf-8");

  const to = section(content, "To").split(/\r?\n/)[0]?.trim() || "";
  const body = section(content, "Proposed reply");

  const subjectMatch = content.match(/^# Draft reply — (.+)$/m);
  const subject = subjectMatch?.[1]?.trim() || "Sem assunto";

  const safetyMarkerPresent = content.includes("Draft only. Not sent.");

  if (!to) throw new Error("Draft parsing failed: missing To section.");
  if (!body) throw new Error("Draft parsing failed: missing Proposed reply section.");
  if (!safetyMarkerPresent) throw new Error("Draft safety marker missing.");

  return {
    draftPath,
    to,
    subject,
    body,
    safetyMarkerPresent
  };
}

function saveReadbackState(parsed: ParsedDraft): string {
  const stateDir = path.join(root, "founder-command-center", "hermes", "state");
  fs.mkdirSync(stateDir, { recursive: true });

  const now = new Date().toISOString();

  const state: DraftReadbackState = {
    draftPath: parsed.draftPath,
    to: parsed.to,
    subject: parsed.subject,
    readbackCompletedAt: now,
    sendQuestionAskedAt: now,
    prompt: "Aprovas? Posso enviar?",
    status: "awaiting_voice_approval"
  };

  const statePath = path.join(stateDir, "latest-draft-readback.json");
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");

  return statePath;
}

function main() {
  const draftPath = latestValidDraft();

  if (!draftPath) {
    throw new Error("No valid Hermes draft found.");
  }

  const parsed = parseDraft(draftPath);
  const statePath = saveReadbackState(parsed);

  console.log("HERMES DRAFT READBACK");
  console.log("=".repeat(72));
  console.log(`To: ${parsed.to}`);
  console.log(`Subject: ${parsed.subject}`);
  console.log("");
  console.log("Body:");
  console.log(parsed.body);
  console.log("");
  console.log("=".repeat(72));
  console.log("Aprovas? Posso enviar?");
  console.log("");
  console.log(`Readback state saved: ${statePath}`);
  console.log("Valid contextual approval examples:");
  console.log('- "aprovo, envio"');
  console.log('- "aprovo envio"');
  console.log('- "aprovo, podes enviar"');
}

main();
