import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const root = process.cwd();

type ParsedDraft = {
  draftPath: string;
  to: string;
  subject: string;
  body: string;
  safetyMarkerPresent: boolean;
};

function chromePath(): string {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) throw new Error("Chrome executable not found.");

  return found;
}

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

  return { draftPath, to, subject, body, safetyMarkerPresent };
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

function main() {
  const draftPath = latestValidDraft();

  if (!draftPath) throw new Error("No valid Hermes draft found.");

  const parsed = parseDraft(draftPath);
  const url = gmailComposeUrl(parsed);

  if (url.length > 7500) {
    throw new Error("Gmail compose URL is too long. Use manual copy or future paste mode.");
  }

  const chrome = chromePath();
  const debugPort = process.env.ZEUS_CHROME_DEBUG_PORT || "9222";

  const userDataDir =
    process.env.ZEUS_CHROME_USER_DATA_DIR ||
    path.join(root, "founder-command-center", "hermes", "chrome-debug-profile");

  fs.mkdirSync(userDataDir, { recursive: true });

  const child = spawn(
    chrome,
    [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "--new-window",
      url
    ],
    {
      detached: true,
      stdio: "ignore"
    }
  );

  child.unref();

  const stateDir = path.join(root, "founder-command-center", "hermes", "state");
  fs.mkdirSync(stateDir, { recursive: true });

  const statePath = path.join(stateDir, "chrome-debug-session.json");

  fs.writeFileSync(
    statePath,
    JSON.stringify(
      {
        pid: child.pid,
        debugPort,
        userDataDir,
        draftPath: parsed.draftPath,
        to: parsed.to,
        subject: parsed.subject,
        createdAt: new Date().toISOString()
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log("Chrome debug compose opened.");
  console.log(`PID: ${child.pid}`);
  console.log(`To: ${parsed.to}`);
  console.log(`Subject: ${parsed.subject}`);
  console.log(`State saved: ${statePath}`);
  console.log("No email was sent.");
}

main();
