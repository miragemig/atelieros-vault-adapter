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

function section(content: string, heading: string): string {
  const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(\\n## |$)`, "m");
  const match = content.match(pattern);
  return match?.[1]?.trim() || "";
}

function parseDraft(draftPath: string): ParsedDraft {
  const content = fs.readFileSync(draftPath, "utf-8");

  const to = section(content, "To").split(/\r?\n/)[0]?.trim() || "";
  const proposedReply = section(content, "Proposed reply");

  const subjectMatch = content.match(/^# Draft reply — (.+)$/m);
  const subject = subjectMatch?.[1]?.trim() || "Sem assunto";

  const safetyMarkerPresent = content.includes("Draft only. Not sent.");

  if (!to) {
    throw new Error("Draft parsing failed: missing To section.");
  }

  if (!proposedReply) {
    throw new Error("Draft parsing failed: missing Proposed reply section.");
  }

  if (!safetyMarkerPresent) {
    throw new Error("Draft parsing failed: safety marker missing.");
  }

  return {
    draftPath,
    to,
    subject,
    body: proposedReply,
    safetyMarkerPresent
  };
}

function main() {
  const argPath = process.argv[2];
  const draftPath = argPath
    ? path.isAbsolute(argPath)
      ? argPath
      : path.join(root, argPath)
    : latestDraft();

  if (!draftPath) {
    throw new Error("No draft path provided and no latest Hermes draft found.");
  }

  const parsed = parseDraft(draftPath);

  console.log(JSON.stringify(parsed, null, 2));
}

main();
