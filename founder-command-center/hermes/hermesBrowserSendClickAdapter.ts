import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { chromium } from "playwright-core";

const root = process.cwd();

type ClickLog = {
  id: string;
  createdAt: string;
  status: "sent_click_performed" | "blocked";
  approvedBy: string | null;
  reasons: string[];
  gmailPageUrl?: string;
};

function parseApprovedBy(args: string[]): string | null {
  const index = args.indexOf("--approved-by");
  return index >= 0 ? args[index + 1] || null : null;
}

function runTs(script: string): { code: number; output: string } {
  try {
    const output = execFileSync(
      ".\\node_modules\\.bin\\tsx.cmd",
      [script],
      {
        cwd: root,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"]
      }
    ).trim();

    return { code: 0, output };
  } catch (error: any) {
    const stdout = error?.stdout?.toString?.() || "";
    const stderr = error?.stderr?.toString?.() || "";

    return {
      code: error?.status || 1,
      output: [stdout, stderr].filter(Boolean).join("\n").trim()
    };
  }
}

function writeLog(log: ClickLog): string {
  const dir = path.join(root, "founder-command-center", "hermes", "sent-log");
  fs.mkdirSync(dir, { recursive: true });

  const outputPath = path.join(dir, `${log.id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(log, null, 2), "utf-8");

  return outputPath;
}

async function block(approvedBy: string | null, reasons: string[], gmailPageUrl?: string) {
  const log: ClickLog = {
    id: `browser-send-click-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "blocked",
    approvedBy,
    reasons,
    gmailPageUrl
  };

  const logPath = writeLog(log);

  console.log(JSON.stringify(log, null, 2));
  console.log(`Log created: ${logPath}`);
  process.exit(2);
}

async function main() {
  const approvedBy = parseApprovedBy(process.argv.slice(2));
  const reasons: string[] = [];

  if (approvedBy !== "Miguel") {
    reasons.push("Missing explicit approval: --approved-by Miguel");
  }

  if (process.env.ZEUS_ALLOW_BROWSER_SEND_CLICK !== "true") {
    reasons.push("ZEUS_ALLOW_BROWSER_SEND_CLICK is not true.");
  }

  const readiness = runTs("founder-command-center\\hermes\\hermesSendReadiness.ts");

  if (readiness.code !== 0) {
    reasons.push("Send readiness failed.");
    if (readiness.output) reasons.push(readiness.output);
  }

  const gate = runTs("founder-command-center\\hermes\\hermesBrowserSendGate.ts");

  if (gate.code !== 0) {
    reasons.push("Browser send gate failed.");
    if (gate.output) reasons.push(gate.output);
  }

  if (reasons.length > 0) {
    await block(approvedBy, reasons);
  }

  const debugPort = process.env.ZEUS_CHROME_DEBUG_PORT || "9222";
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);

  const pages = browser
    .contexts()
    .flatMap((context) => context.pages());

  const gmailPage = pages.find((page) =>
    page.url().includes("mail.google.com")
  );

  if (!gmailPage) {
    await browser.close();
    await block(approvedBy, ["No Gmail page found in Chrome CDP session."]);
  }

  await gmailPage.bringToFront();

  const url = gmailPage.url();

  if (!url.includes("mail.google.com")) {
    await browser.close();
    await block(approvedBy, ["Active page is not Gmail."], url);
  }

  const sendButtonCandidates = [
    gmailPage.getByRole("button", { name: /^Send$/i }),
    gmailPage.getByRole("button", { name: /^Enviar$/i }),
    gmailPage.locator('div[role="button"][aria-label*="Send"]').first(),
    gmailPage.locator('div[role="button"][aria-label*="Enviar"]').first()
  ];

  let clicked = false;

  for (const candidate of sendButtonCandidates) {
    try {
      if (await candidate.isVisible({ timeout: 1500 })) {
        await candidate.click();
        clicked = true;
        break;
      }
    } catch {
      // Try next candidate.
    }
  }

  await browser.close();

  if (!clicked) {
    await block(approvedBy, ["Send button not found or not visible."], url);
  }

  const log: ClickLog = {
    id: `browser-send-click-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "sent_click_performed",
    approvedBy,
    reasons: [],
    gmailPageUrl: url
  };

  const logPath = writeLog(log);

  console.log(JSON.stringify(log, null, 2));
  console.log(`Log created: ${logPath}`);
}

main();
