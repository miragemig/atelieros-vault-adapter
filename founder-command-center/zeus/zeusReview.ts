import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { readGatewayState, readRecentEvents } from "./zeusControlPlane";

const root = process.cwd();

function safeExec(command: string): string {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh"
    }).trim();
  } catch {
    return "";
  }
}

function countFiles(dir: string, predicate?: (name: string) => boolean): number {
  if (!fs.existsSync(dir)) return 0;
  return predicate ? fs.readdirSync(dir).filter(predicate).length : fs.readdirSync(dir).length;
}

function section(title: string) {
  console.log("");
  console.log("=".repeat(70));
  console.log(`  ${title}`);
  console.log("=".repeat(70));
}

function bullet(key: string, value: string) {
  console.log(`  ${key.padEnd(30)} ${value}`);
}

function statusIcon(ok: boolean): string {
  return ok ? "✅" : "❌";
}

function main() {
  const gateway = readGatewayState();

  console.log("");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║            ZEUS REVIEW                       ║");
  console.log("╚══════════════════════════════════════════════╝");

  // ── 1. Working tree ──
  section("WORKING TREE  ");
  const gitStatus = safeExec("git status --short");
  const gitBranch = safeExec("git rev-parse --abbrev-ref HEAD") || "unknown";
  const gitLog = safeExec("git log --oneline -3");
  const isClean = gitStatus === "";

  console.log(`  Branch:       ${gitBranch}`);
  console.log(`  Clean:        ${isClean ? "✅ yes" : "❌ no"}`);

  if (!isClean) {
    console.log("");
    console.log("  Modified files:");
    for (const line of gitStatus.split("\n").filter(Boolean)) {
      console.log(`    ${line}`);
    }
    console.log("");
    console.log("  ⚠️  Working tree is dirty. Overnight autonomy blocked.");
  }

  console.log("");
  console.log("  Recent commits:");
  for (const line of gitLog.split("\n").filter(Boolean)) {
    console.log(`    ${line}`);
  }

  // ── 2. Risk assessment ──
  section("RISK ASSESSMENT");
  const hasDoctor = gateway?.controlPlane?.latestDoctorReport;
  const buildStatus = gateway?.build?.latestReportStatus;
  const eventCount = gateway?.controlPlane?.eventCount || 0;
  const mode = gateway?.mode || "DELIBERATION_ONLY";

  console.log(`  ${statusIcon(Boolean(hasDoctor))} Doctor report available:  ${hasDoctor ? "yes" : "no"}`);
  console.log(`  ${statusIcon(buildStatus === "pass")} Last build status:        ${buildStatus || "unknown"}`);
  console.log(`  ${statusIcon(eventCount > 0)} Event journal entries:    ${eventCount}`);
  console.log(`  ${statusIcon(mode !== "DELIBERATION_ONLY")} Runtime mode:             ${mode}`);

  const riskLevel = !isClean ? "HIGH" : buildStatus === "fail" ? "MEDIUM" : "LOW";
  console.log(`  ⚡ Risk level:             ${riskLevel}`);

  // ── 3. Pending approvals ──
  section("PENDING APPROVALS");
  const approvalsDir = path.join(root, "founder-command-center", "hermes", "approvals");
  const sendGatesDir = path.join(root, "founder-command-center", "hermes", "send-gates");
  const approvalCount = countFiles(approvalsDir, (n) => n.endsWith(".json"));
  const sendGateCount = countFiles(sendGatesDir, (n) => n.endsWith(".json"));

  console.log(`  Approvals waiting:   ${approvalCount}`);
  console.log(`  Send gates waiting:  ${sendGateCount}`);

  // Show latest pending approval
  if (approvalCount > 0) {
    const files = fs.readdirSync(approvalsDir).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, 3);
    for (const f of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(approvalsDir, f), "utf-8"));
        console.log(`    - ${content.id || f} | ${content.status || "pending"}`);
      } catch {
        console.log(`    - ${f} (unparseable)`);
      }
    }
  }

  // ── 4. Build blockers ──
  section("OVERNIGHT BLOCKERS");
  const blockers: string[] = [];

  if (!isClean) {
    blockers.push("Working tree dirty — overnight builds skipped");
  }
  if (!hasDoctor) {
    blockers.push("No doctor report — system health unknown");
  }
  if (buildStatus === "fail") {
    blockers.push("Last build failed — pipeline cannot proceed");
  }
  if (mode === "DELIBERATION_ONLY") {
    blockers.push("Mode DELIBERATION_ONLY — autonomous builds disabled");
  }
  if (blockers.length === 0) {
    blockers.push("No blockers — system can run overnight");
  }

  for (const b of blockers) {
    console.log(`  ${blockers.length === 1 && b.startsWith("No") ? "✅" : "⚠️"} ${b}`);
  }

  // ── 5. Hephaestus readiness ──
  section("HEPHAESTUS BUILD READINESS");
  const patchCandidatesDir = path.join(root, "founder-command-center", "patch-system", "patch-candidates");
  const patchReportsDir = path.join(root, "founder-command-center", "patch-system", "patch-reports");
  const patchCandidatesCount = fs.existsSync(patchCandidatesDir)
    ? fs.readdirSync(patchCandidatesDir).filter((f) => fs.statSync(path.join(patchCandidatesDir, f)).isDirectory()).length
    : 0;
  const patchReportsCount = countFiles(patchReportsDir, (n) => n.endsWith(".json"));
  const quarantineCount = countFiles(
    path.join(root, "founder-command-center", "build-system", "quarantine"),
    (n) => n.endsWith(".ts")
  );

  console.log(`  Patch candidates:    ${patchCandidatesCount}`);
  console.log(`  Patch reports:       ${patchReportsCount}`);
  console.log(`  Quarantine drafts:   ${quarantineCount}`);
  console.log(`  Ollama available:    ${Boolean(safeExec("ollama --version")).toString()}`);
  console.log(`  Build pipeline:      ${fs.existsSync(path.join(root, "founder-command-center", "build-system", "buildPipeline.ts")) ? "ready" : "missing"}`);

  // ── Final ──
  section("SUMMARY");
  if (riskLevel === "HIGH") {
    console.log("  ❌ HIGH RISK — Blocked. Fix working tree first.");
  } else if (riskLevel === "MEDIUM") {
    console.log("  ⚠️  MEDIUM RISK — Review build failure before proceeding.");
  } else {
    console.log("  ✅ LOW RISK — System is ready.");
  }
  console.log("");
}

main();