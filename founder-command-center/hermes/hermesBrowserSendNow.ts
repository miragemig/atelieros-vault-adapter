import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();

type SendNowLog = {
  id: string;
  createdAt: string;
  approvedBy: string | null;
  status: "blocked" | "ready_but_click_disabled";
  realBrowserClickPerformed: false;
  reasons: string[];
  nextRequiredStep: string;
};

function parseApprovedBy(args: string[]): string | null {
  const index = args.indexOf("--approved-by");
  return index >= 0 ? args[index + 1] || null : null;
}

function safeExec(command: string): { code: number; output: string } {
  try {
    const output = execSync(command, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();

    return { code: 0, output };
  } catch (error: any) {
    const stdout = error?.stdout?.toString?.() || "";
    const stderr = error?.stderr?.toString?.() || "";
    const output = [stdout, stderr].filter(Boolean).join("\n").trim();

    return { code: error?.status || 1, output };
  }
}

function writeLog(log: SendNowLog): string {
  const dir = path.join(root, "founder-command-center", "hermes", "send-now");
  fs.mkdirSync(dir, { recursive: true });

  const outputPath = path.join(dir, `${log.id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(log, null, 2), "utf-8");

  return outputPath;
}

function main() {
  const approvedBy = parseApprovedBy(process.argv.slice(2));
  const reasons: string[] = [];

  if (approvedBy !== "Miguel") {
    reasons.push("Missing explicit approval: --approved-by Miguel");
  }

  const readiness = safeExec(
    ".\\node_modules/.bin/tsx.cmd founder-command-center\\hermes\\hermesSendReadiness.ts"
  );

  if (readiness.code !== 0) {
    reasons.push("Send readiness failed.");
    if (readiness.output) reasons.push(readiness.output);
  }

  const gate = safeExec(
    ".\\node_modules/.bin/tsx.cmd founder-command-center\\hermes\\hermesBrowserSendGate.ts"
  );

  if (gate.code !== 0) {
    reasons.push("Browser send gate failed.");
    if (gate.output) reasons.push(gate.output);
  }

  const clickAllowed = process.env.ZEUS_ALLOW_BROWSER_SEND_CLICK === "true";

  if (!clickAllowed) {
    reasons.push("Browser send click is disabled. Set ZEUS_ALLOW_BROWSER_SEND_CLICK=true only after browser-control is implemented and tested.");
  }

  const onlyClickDisabled =
    reasons.length === 1 &&
    reasons[0].startsWith("Browser send click is disabled");

  const status: SendNowLog["status"] = onlyClickDisabled
    ? "ready_but_click_disabled"
    : "blocked";

  const log: SendNowLog = {
    id: `browser-send-now-${Date.now()}`,
    createdAt: new Date().toISOString(),
    approvedBy,
    status,
    realBrowserClickPerformed: false,
    reasons,
    nextRequiredStep:
      status === "ready_but_click_disabled"
        ? "Implement browser-control click adapter for the AtelierOS Ops Chrome profile."
        : "Resolve blocked reasons before attempting browser send."
  };

  const logPath = writeLog(log);

  console.log(JSON.stringify(log, null, 2));
  console.log("");
  console.log(`Send-now log created: ${logPath}`);

  process.exit(status === "ready_but_click_disabled" ? 0 : 2);
}

main();
