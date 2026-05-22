import fs from "fs";
import path from "path";

const root = process.cwd();
const overnightReportsDir = path.join(root, "founder-command-center/runtime/overnight/reports");
const morningReportsDir = path.join(root, "founder-command-center/runtime/morning");

type MorningReport = {
  system: "ZEUS";
  generatedAt: string;
  mode: "MORNING_REVIEW";
  
  // Overnight summary
  overnight: {
    startedAt?: string;
    endedAt?: string;
    totalCycles: number;
    results: {
      autonomouslyApplied: number;
      passedForReview: number;
      failed: number;
      skipped: number;
    };
  };
  
  // What was attempted
  attempted: Array<{
    taskId: string;
    taskTitle: string;
    startedAt: string;
    status: "applied" | "failed" | "skipped";
    reason?: string;
  }>;
  
  // What was applied to core
  applied: Array<{
    candidateId: string;
    taskId: string;
    destinationPath: string;
    appliedAt: string;
    requiresReview: boolean;
  }>;
  
  // What failed
  failed: Array<{
    taskId: string;
    reason: string;
    attemptedAt: string;
    suggestedAction?: string;
  }>;
  
  // Current state
  state: {
    gitBranch: string;
    buildQueueLength: number;
    pendingApprovals: number;
    hermesOutbox: number;
  };
  
  // Recommendations
  recommendations: {
    priority: string;
    action: string;
    reasoning: string;
  }[];
  
  // Audit trail
  auditPath: string;
};

function getLatestOvernightReport(): any | null {
  try {
    if (!fs.existsSync(overnightReportsDir)) return null;
    
    const files = fs
      .readdirSync(overnightReportsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({
        name: f,
        path: path.join(overnightReportsDir, f),
        time: fs.statSync(path.join(overnightReportsDir, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) return null;
    
    return JSON.parse(fs.readFileSync(files[0].path, "utf-8"));
  } catch {
    return null;
  }
}

function getLatestBuildReport(): any | null {
  try {
    const reportsDir = path.join(root, "founder-command-center", "build-system", "reports");
    if (!fs.existsSync(reportsDir)) return null;

    const files = fs
      .readdirSync(reportsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({
        name: f,
        path: path.join(reportsDir, f),
        time: fs.statSync(path.join(reportsDir, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) return null;
    return JSON.parse(fs.readFileSync(files[0].path, "utf-8"));
  } catch {
    return null;
  }
}

function getGitState() {
  try {
    const { execSync } = require("child_process");
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: root, encoding: "utf-8" }).trim();
    return { branch };
  } catch {
    return { branch: "unknown" };
  }
}

function getPendingApprovals(): number {
  try {
    const candidatesDir = path.join(root, "founder-command-center", "build-system", "approval-candidates");
    if (!fs.existsSync(candidatesDir)) return 0;
    return fs.readdirSync(candidatesDir)
      .filter((f) => f.endsWith(".candidate.ts"))
      .length;
  } catch {
    return 0;
  }
}

function getBuildQueueLength(): number {
  try {
    const queuePath = path.join(root, "founder-command-center", "build-system", "roadmapQueue.json");
    if (!fs.existsSync(queuePath)) return 0;
    const queue = JSON.parse(fs.readFileSync(queuePath, "utf-8"));
    return (queue.tasks || []).filter((t: any) => t.status === "queued").length;
  } catch {
    return 0;
  }
}

function getHermesOutboxCount(): number {
  try {
    const outboxDir = path.join(root, "founder-command-center", "hermes", "outbox");
    if (!fs.existsSync(outboxDir)) return 0;
    return fs.readdirSync(outboxDir).filter((f) => f.endsWith(".json")).length;
  } catch {
    return 0;
  }
}

function generateMorningReport(): MorningReport {
  const overnightReport = getLatestOvernightReport();
  const latestBuildReport = getLatestBuildReport();
  const gitState = getGitState();
  
  const attempted = (overnightReport?.cycles || []).map((cycle: any) => ({
    taskId: cycle.selectedTaskId || "none",
    taskTitle: cycle.selectedTaskId || "task selection",
    startedAt: cycle.startedAt,
    status:
      cycle.outcome === "build_applied_autonomously" ? "applied" :
      cycle.outcome === "build_failed" ? "failed" : "skipped",
    reason:
      cycle.outcome === "skipped_git_dirty" ? "git state not clean" :
      cycle.outcome === "no_queued_tasks" ? "no tasks in queue" :
      cycle.outcome === "selection_failed" ? "task selection failed" :
      cycle.outcome === "build_failed" ? "build failed" : undefined
  }));

  if (!overnightReport && latestBuildReport) {
    attempted.push({
      taskId: latestBuildReport.taskId || "unknown",
      taskTitle: latestBuildReport.taskTitle || "unknown",
      startedAt: latestBuildReport.createdAt || new Date().toISOString(),
      status: latestBuildReport.status === "pass" ? "applied" : "failed",
      reason: latestBuildReport.status === "fail" ? "build pipeline failed" : undefined
    });
  }

  const report: MorningReport = {
    system: "ZEUS",
    generatedAt: new Date().toISOString(),
    mode: "MORNING_REVIEW",
    
    overnight: {
      startedAt: overnightReport?.startedAt,
      endedAt: overnightReport?.finishedAt,
      totalCycles: overnightReport?.summary?.totalCycles || 0,
      results: {
        autonomouslyApplied: overnightReport?.summary?.autonomouslyApplied || 0,
        passedForReview: overnightReport?.summary?.passedToWaitingReview || 0,
        failed: overnightReport?.summary?.failed || 0,
        skipped: overnightReport?.summary?.skippedDirty || 0
      }
    },
    
    attempted,
    
    applied: overnightReport
      ? attempted
          .filter((a) => a.status === "applied")
          .map((a, idx) => ({
            candidateId: `candidate-${idx}`,
            taskId: a.taskId,
            destinationPath: "core-local",
            appliedAt: a.startedAt,
            requiresReview: true
          }))
      : [],
    
    failed: attempted
      .filter((a) => a.status === "failed")
      .map((a) => ({
        taskId: a.taskId,
        reason: a.reason || "unknown error",
        attemptedAt: a.startedAt,
        suggestedAction: "Review logs and retry"
      })) || [],
    
    state: {
      gitBranch: gitState.branch,
      buildQueueLength: getBuildQueueLength(),
      pendingApprovals: getPendingApprovals(),
      hermesOutbox: getHermesOutboxCount()
    },
    
    recommendations: [
      {
        priority: "HIGH",
        action: "Review overnight build results",
        reasoning: "Autonomous work completed; requires human approval before production push"
      },
      {
        priority: "MEDIUM",
        action: "Check failed tasks",
        reasoning: "Failed tasks should be analyzed to improve next build cycle"
      },
      {
        priority: "LOW",
        action: "Monitor system health",
        reasoning: "Verify that system state is consistent and ready for next cycle"
      }
    ],
    
    auditPath:
      overnightReport?.cycles?.[0]?.logFile ||
      latestBuildReport?.finalCandidatePath ||
      latestBuildReport?.createdAt ||
      "unknown"
  };
  
  return report;
}

function writeMorningReport(report: MorningReport) {
  fs.mkdirSync(morningReportsDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const reportPath = path.join(morningReportsDir, `morning-report-${timestamp}.json`);
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  return reportPath;
}

function printReport(report: MorningReport) {
  console.log("\n=== ZEUS MORNING REPORT ===\n");
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Git branch: ${report.state.gitBranch}`);
  console.log(`Build queue: ${report.state.buildQueueLength} tasks`);
  console.log(`Pending approvals: ${report.state.pendingApprovals}`);
  console.log(`Hermes outbox: ${report.state.hermesOutbox} drafts`);
  console.log("");
  
  console.log("OVERNIGHT SUMMARY");
  console.log(`Total cycles: ${report.overnight.totalCycles}`);
  console.log(`Applied autonomously: ${report.overnight.results.autonomouslyApplied}`);
  console.log(`Passed for review: ${report.overnight.results.passedForReview}`);
  console.log(`Failed: ${report.overnight.results.failed}`);
  console.log(`Skipped: ${report.overnight.results.skipped}`);
  console.log("");
  
  if (report.applied.length > 0) {
    console.log("APPLIED CHANGES");
    report.applied.forEach((app) => {
      console.log(`  - ${app.taskId} → ${app.destinationPath} (requires review)`);
    });
    console.log("");
  }
  
  if (report.failed.length > 0) {
    console.log("FAILED TASKS");
    report.failed.forEach((fail) => {
      console.log(`  - ${fail.taskId}: ${fail.reason}`);
    });
    console.log("");
  }
  
  console.log("RECOMMENDATIONS");
  report.recommendations.forEach((rec) => {
    console.log(`  [${rec.priority}] ${rec.action}`);
    console.log(`         ${rec.reasoning}`);
  });
  console.log("");
}

function main() {
  const report = generateMorningReport();
  const reportPath = writeMorningReport(report);
  
  printReport(report);
  
  console.log(`Report saved: ${reportPath}\n`);
}

main();
