import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();

type PreflightResult = {
  status: "READY_FOR_BROWSER_CLICK_ADAPTER" | "BLOCKED";
  reasons: string[];
  checks: string[];
  chromePath?: string;
};

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
    return {
      code: error?.status || 1,
      output: [stdout, stderr].filter(Boolean).join("\n").trim()
    };
  }
}

function chromePath(): string | null {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function latestJson(dirPath: string): any | null {
  if (!fs.existsSync(dirPath)) return null;

  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({
      file,
      fullPath: path.join(dirPath, file),
      time: fs.statSync(path.join(dirPath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  if (!files[0]) return null;

  return JSON.parse(fs.readFileSync(files[0].fullPath, "utf-8"));
}

function main() {
  const checks: string[] = [];
  const reasons: string[] = [];

  const chrome = chromePath();

  if (chrome) {
    checks.push(`PASS: Chrome found at ${chrome}`);
  } else {
    reasons.push("Chrome executable not found.");
  }

  const readiness = safeExec(
    ".\\node_modules/.bin/tsx.cmd founder-command-center\\hermes\\hermesSendReadiness.ts"
  );

  if (readiness.code === 0) {
    checks.push("PASS: send-readiness returned READY.");
  } else {
    reasons.push("send-readiness failed.");
    if (readiness.output) reasons.push(readiness.output);
  }

  const latestGate = latestJson(
    path.join(root, "founder-command-center", "hermes", "send-gates")
  );

  if (latestGate?.status === "ready_for_manual_send") {
    checks.push("PASS: latest browser-send-gate is ready_for_manual_send.");
  } else {
    reasons.push("Latest browser-send-gate is missing or not ready.");
  }

  const latestSendNow = latestJson(
    path.join(root, "founder-command-center", "hermes", "send-now")
  );

  if (latestSendNow?.status === "ready_but_click_disabled") {
    checks.push("PASS: latest browser-send-now is ready_but_click_disabled.");
  } else {
    reasons.push("Latest browser-send-now is missing or not ready_but_click_disabled.");
  }

  checks.push("INFO: automated browser click remains disabled in this preflight.");

  const result: PreflightResult = {
    status: reasons.length === 0 ? "READY_FOR_BROWSER_CLICK_ADAPTER" : "BLOCKED",
    reasons,
    checks,
    chromePath: chrome || undefined
  };

  console.log(JSON.stringify(result, null, 2));

  if (result.status === "BLOCKED") {
    process.exit(2);
  }
}

main();
