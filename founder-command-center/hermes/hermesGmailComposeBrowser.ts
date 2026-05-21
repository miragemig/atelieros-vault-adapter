import { execFileSync } from "child_process";
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
  const proposedReply = section(content, "Proposed reply");

  const subjectMatch = content.match(/^# Draft reply — (.+)$/m);
  const subject = subjectMatch?.[1]?.trim() || "Sem assunto";

  const safetyMarkerPresent = content.includes("Draft only. Not sent.");

  if (!to) throw new Error("Draft parsing failed: missing To section.");
  if (!proposedReply) throw new Error("Draft parsing failed: missing Proposed reply section.");
  if (!safetyMarkerPresent) throw new Error("Draft safety marker missing.");

  return {
    draftPath,
    to,
    subject,
    body: proposedReply,
    safetyMarkerPresent
  };
}

function gmailComposeUrl(parsed: ParsedDraft): string {
  const base = "https://mail.google.com/mail/";
  const params = new URLSearchParams({
    authuser: "atelieros.ops@gmail.com",
    view: "cm",
    fs: "1",
    to: parsed.to,
    su: parsed.subject,
    body: parsed.body
  });

  return `${base}?${params.toString()}`;
}

function openInBrowser(url: string): void {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const profileDirectory = "Profile 3";

  if (!fs.existsSync(chromePath)) {
    execFileSync("cmd.exe", ["/c", "start", "", url], {
      stdio: "ignore"
    });
    return;
  }

  execFileSync(chromePath, [
    `--profile-directory=${profileDirectory}`,
    url
  ], {
    stdio: "ignore"
  });
}

function main() {
  const draftPath = latestDraft();

  if (!draftPath) {
    throw new Error("No Hermes draft found.");
  }

  const parsed = parseDraft(draftPath);
  const url = gmailComposeUrl(parsed);

  if (url.length > 7500) {
    throw new Error(
      "Gmail compose URL is too long. Use manual copy or future browser paste mode."
    );
  }

  openInBrowser(url);

  console.log("Gmail compose opened in browser.");
  console.log("No email was sent.");
  console.log("Miguel must review and click Send manually.");
  console.log(`Draft source: ${draftPath}`);
}

main();





