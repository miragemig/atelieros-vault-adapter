import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const root = process.cwd();

type GateLog = {
  id: string;
  createdAt: string;
  status: "ready_for_manual_send" | "blocked";
  realBrowserClickPerformed: false;
  reasons: string[];
  note: string;
};

function runTs(script: string): { code: number; output: string } {
  try {
    const output = execFileSync(
      ".\\node_modules/.bin/tsx.cmd",
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

function main() {
  const readiness = runTs("founder-command-center/hermes\\hermesSendReadiness.ts");

  const reasons: string[] = [];

  if (readiness.code !== 0) {
    reasons.push("Send readiness check failed.");
    if (readiness.output) reasons.push(readiness.output);
  }

  const gateStatus: GateLog["status"] =
    reasons.length === 0 ? "ready_for_manual_send" : "blocked";

  const log: GateLog = {
    id: `browser-send-gate-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: gateStatus,
    realBrowserClickPerformed: false,
    reasons,
    note:
      gateStatus === "ready_for_manual_send"
        ? "All checks passed. Manual send is allowed. Automated browser click is still disabled in v0.1."
        : "Blocked. Do not send until reasons are resolved."
  };

  const gateDir = path.join(
    root,
    "founder-command-center",
    "hermes",
    "send-gates"
  );

  fs.mkdirSync(gateDir, { recursive: true });

  const outputPath = path.join(gateDir, `${log.id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(log, null, 2), "utf-8");

  console.log(JSON.stringify(log, null, 2));

  if (gateStatus === "blocked") {
    process.exit(2);
  }

  console.log("");
  console.log("Browser send gate passed.");
  console.log("No browser click was performed.");
  console.log("Miguel may manually click Send in Gmail.");
}

main();
