import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { appendEvent, syncGatewayState } from "./zeusControlPlane";

const root = process.cwd();
const runtimeDir = path.join(root, "founder-command-center", "runtime");
const overnightDir = path.join(runtimeDir, "overnight");
const overnightReportsDir = path.join(overnightDir, "reports");
  const buildTaskPath = path.join(
    root,
    "founder-command-center",
    "runtime",
    "buildTask.json"
  );

type CycleResult = {
  cycle: number;
  startedAt: string;
  finishedAt: string;
  selectedTaskId: string | null;
  logFile: string;
  outcome:
    | "skipped_git_dirty"
    | "no_queued_tasks"
    | "selection_failed"
    | "build_pass_waiting_review"
    | "build_applied_autonomously"
    | "build_failed";
  notes: string[];
};

type OvernightReport = {
  system: "ZEUS";
  mode: "OVERNIGHT_SAFE_MODE";
  startedAt: string;
  finishedAt: string;
  hours: number;
  intervalMinutes: number;
  cycles: CycleResult[];
  summary: {
    totalCycles: number;
    passedToWaitingReview: number;
    autonomouslyApplied: number;
    failed: number;
    skippedDirty: number;
    noQueuedTasks: number;
  };
};

function getShell() {
  return process.platform === "win32" ? "powershell.exe" : "/bin/sh";
}

function ensureDirs() {
  fs.mkdirSync(overnightDir, { recursive: true });
  fs.mkdirSync(overnightReportsDir, { recursive: true });
}

function timestampStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function safeExec(command: string): string {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: getShell(),
      env: process.env
    }).trim();
  } catch (error: any) {
    const stdout = error?.stdout?.toString?.() || "";
    const stderr = error?.stderr?.toString?.() || "";
    return [stdout, stderr, error?.message || String(error)].filter(Boolean).join("\n").trim();
  }
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").trim();
}

function relevantGitStatus(rawStatus: string): string {
  const ignoredPrefixes = [
    "founder-command-center/runtime/zeus-event-journal.jsonl",
    "founder-command-center/runtime/zeus-gateway-state.json",
    "founder-command-center/runtime/overnight/",
    "founder-command-center/runtime/morning/",
    "founder-command-center/logs/doctor/"
  ];

  const ignoredPatterns = [
    /\.zip$/,
    /\.log$/,
    /overnight-test/,
    /^fix$/,
    /^fixDaemon\.ts$/,
    /^fixHermes\.ts$/,
    /^fixWindowsDependencies\.ts$/
  ];

  return rawStatus
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      // Ignore untracked files (starts with ??)
      if (line.startsWith("??")) {
        return false;
      }

      const normalizedLine = normalizePath(line);
      const pathPart = normalizedLine.slice(3).trim();

      // Check ignored prefixes
      if (ignoredPrefixes.some((prefix) => pathPart.startsWith(prefix))) {
        return false;
      }

      // Check ignored patterns
      if (ignoredPatterns.some((pattern) => pattern.test(pathPart))) {
        return false;
      }

      return true;
    })
    .join("\n");
}

// Maximum seconds a single overnight step may run before forced termination.
// Prevents a hung model, stuck pipeline, or stalled approval candidate
// from wedging the overnight loop indefinitely.
const EXEC_STEP_TIMEOUT_MS = 300_000; // 5 minutes

function execStep(command: string, timeoutMs: number = EXEC_STEP_TIMEOUT_MS) {
  return execSync(command, {
    cwd: root,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: getShell(),
    timeout: timeoutMs,
    env: {
      ...process.env,
      ZEUS_RUNTIME_MODE: "OVERNIGHT_SAFE_MODE",
      ZEUS_ALLOW_CORE_APPLY: "false",
      ZEUS_ALLOW_GIT_COMMIT: "false",
      ZEUS_ALLOW_GIT_PUSH: "false",
      ZEUS_ALLOW_EMAIL_SEND: "false",
      ZEUS_ALLOW_PROJECT_CREATION: "false",
      ZEUS_AUTONOMOUS_CONSTRUCTION: "true",
      ENABLE_PAID_APIS: "false",
      MAX_ADDITIONAL_COST_EUR: "0"
    }
  }).trim();
}

function sleep(ms: number) {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  if (process.platform === "win32") {
    execSync(`ping 127.0.0.1 -n ${seconds + 1} > nul`, { stdio: "ignore", shell: getShell() });
  } else {
    execSync(`sleep ${seconds}`, { stdio: "ignore", shell: getShell() });
  }
}

function writeLogLine(logFile: string, message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, line, "utf-8");
  console.log(line.trim());
}

function readBuildTaskBackup() {
  if (!fs.existsSync(buildTaskPath)) return null;
  return fs.readFileSync(buildTaskPath, "utf-8");
}

function restoreBuildTask(content: string | null) {
  if (content === null) {
    if (fs.existsSync(buildTaskPath)) {
      fs.unlinkSync(buildTaskPath);
    }
    return;
  }

  fs.writeFileSync(buildTaskPath, content, "utf-8");
}

function latestCandidateMetadata(): string | null {
  const dir = path.join(
    root,
    "founder-command-center",
    "build-system",
    "approval-candidates"
  );

  if (!fs.existsSync(dir)) return null;

  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".metadata.json"))
    .map((file) => ({
      file,
      fullPath: path.join(dir, file),
      time: fs.statSync(path.join(dir, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  return files[0]?.fullPath || null;
}

function defaultCoreDestination(candidateId: string): string {
  return path.join(
    root,
    "founder-command-center",
    "core-candidates",
    `${candidateId}.ts`
  );
}

function runDoctorOnce(logFile: string) {
  writeLogLine(logFile, "Running ZEUS doctor before overnight loop.");
  try {
    const output = execStep(
      "npx tsx founder-command-center/zeus/zeusDoctor.ts"
    );
    if (output) writeLogLine(logFile, output);
  } catch (error: any) {
    writeLogLine(logFile, "ZEUS doctor failed before overnight loop.");
    writeLogLine(logFile, error?.stderr?.toString?.() || error?.message || String(error));
  }
}

function writeOvernightReport(report: OvernightReport) {
  const reportPath = path.join(
    overnightReportsDir,
    `overnight-report-${timestampStamp()}.json`
  );
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  return reportPath;
}

function main() {
  ensureDirs();

  const hours = Number(process.argv[2] || "8");
  const intervalMinutes = Number(process.argv[3] || "15");
  const startAt = new Date();
  const endAt = new Date(startAt.getTime() + hours * 60 * 60 * 1000);
  const logFile = path.join(
    overnightDir,
    `overnight-self-build-${timestampStamp()}.log`
  );

  const report: OvernightReport = {
    system: "ZEUS",
    mode: "OVERNIGHT_SAFE_MODE",
    startedAt: startAt.toISOString(),
    finishedAt: startAt.toISOString(),
    hours,
    intervalMinutes,
    cycles: [],
    summary: {
      totalCycles: 0,
      passedToWaitingReview: 0,
      autonomouslyApplied: 0,
      failed: 0,
      skippedDirty: 0,
      noQueuedTasks: 0
    }
  };

  writeLogLine(logFile, "ZEUS overnight self-build started.");
  writeLogLine(logFile, `End time: ${endAt.toISOString()}`);
  writeLogLine(logFile, `Interval minutes: ${intervalMinutes}`);
  writeLogLine(logFile, "Mode: OVERNIGHT_SAFE_MODE");

  const rawInitialGitStatus = safeExec("git status --short");
  const initialGitStatus = relevantGitStatus(rawInitialGitStatus) || "clean";

  appendEvent({
    source: "overnight-self-build",
    type: "overnight_started",
    summary: "ZEUS overnight self-build started.",
    data: { hours, intervalMinutes, logFile, initialGitStatus }
  });

  if (initialGitStatus !== "clean") {
    writeLogLine(logFile, "Initial git state is not clean. Overnight autonomy will not override pre-existing changes.");
    writeLogLine(logFile, initialGitStatus);
  }

  syncGatewayState("overnight-start");
  runDoctorOnce(logFile);

  let cycle = 0;

  while (new Date() < endAt) {
    cycle += 1;
    const cycleStart = new Date();
    const notes: string[] = [];
    let selectedTaskId: string | null = null;
    let outcome: CycleResult["outcome"] = "selection_failed";

    writeLogLine(logFile, `---- cycle ${cycle} started ----`);

    if (initialGitStatus !== "clean") {
      outcome = "skipped_git_dirty";
      notes.push("O repositório já não estava limpo no arranque. O ciclo foi bloqueado por segurança.");
      notes.push(initialGitStatus);
      writeLogLine(logFile, "Initial git state was not clean. Overnight self-build blocked this cycle.");
      writeLogLine(logFile, initialGitStatus);
    } else {
      const buildTaskBackup = readBuildTaskBackup();

      try {
        writeLogLine(logFile, "Selecting next roadmap task.");
        const selectOutput = execStep(
          "npx tsx founder-command-center/build-system/selectNextRoadmapTask.ts"
        );
        if (selectOutput) writeLogLine(logFile, selectOutput);

        const selectedLine = selectOutput
          .split(/\r?\n/)
          .find((line) => line.includes("Selected roadmap task:"));

        if (!selectedLine) {
          outcome = "no_queued_tasks";
          notes.push("Não havia tarefas em fila para construir.");
          writeLogLine(logFile, "No queued roadmap tasks.");
        } else {
          selectedTaskId = selectedLine.replace("Selected roadmap task:", "").trim();
          notes.push(`Tarefa selecionada: ${selectedTaskId}`);

          appendEvent({
            source: "overnight-self-build",
            type: "roadmap_task_selected",
            summary: `ZEUS selected roadmap task ${selectedTaskId} for overnight build.`,
            data: { cycle, taskId: selectedTaskId }
          });

          writeLogLine(logFile, `Running governed build pipeline for task: ${selectedTaskId}`);

          try {
            const pipelineOutput = execStep(
              "npx tsx founder-command-center/build-system/buildPipeline.ts"
            );
            if (pipelineOutput) writeLogLine(logFile, pipelineOutput);

            execStep(
              `npx tsx founder-command-center/build-system/createApprovalCandidate.ts`
            );

            const latestCandidate = latestCandidateMetadata();
            if (!latestCandidate) {
              throw new Error("Approval candidate metadata was not created.");
            }

            const candidateMetadata = JSON.parse(
              fs.readFileSync(latestCandidate, "utf-8")
            ) as {
              candidateId: string;
              coreDestinationPath?: string | null;
            };

            const candidateId = candidateMetadata.candidateId;
            const destinationPath =
              candidateMetadata.coreDestinationPath || defaultCoreDestination(candidateId);

            execStep(
              `npx tsx founder-command-center/build-system/approveCandidate.ts ${candidateId} --autonomous`
            );
            execStep(
              `npx tsx founder-command-center/build-system/applyApprovedCandidateToCore.ts ${candidateId} "${destinationPath}" --apply --autonomous`
            );
            execStep(
              `npx tsx founder-command-center/build-system/markRoadmapTask.ts ${selectedTaskId} waiting_morning_review`
            );

            outcome = "build_applied_autonomously";
            notes.push("Pipeline passou e o candidate foi aplicado autonomamente ao core.");
            notes.push(`Candidate metadata: ${latestCandidate}`);
            notes.push(`Destino aplicado: ${destinationPath}`);
            writeLogLine(logFile, `Task moved to waiting_morning_review: ${selectedTaskId}`);

            appendEvent({
              source: "overnight-self-build",
              type: "candidate_applied_autonomously",
              summary: `ZEUS applied candidate autonomously for ${selectedTaskId}.`,
              data: {
                cycle,
                taskId: selectedTaskId,
                candidateId,
                latestCandidate,
                destinationPath
              }
            });
          } catch (error: any) {
            outcome = "build_failed";
            notes.push("Pipeline falhou.");
            notes.push(error?.stderr?.toString?.() || error?.message || String(error));
            writeLogLine(logFile, `Build pipeline failed for task: ${selectedTaskId}`);
            writeLogLine(logFile, error?.stderr?.toString?.() || error?.message || String(error));

            try {
              execStep(
                `npx tsx founder-command-center/build-system/markRoadmapTask.ts ${selectedTaskId} failed`
              );
            } catch {
              writeLogLine(logFile, `Unable to mark task as failed: ${selectedTaskId}`);
            }

            appendEvent({
              source: "overnight-self-build",
              type: "build_failed",
              summary: `ZEUS overnight build failed for ${selectedTaskId}.`,
              data: { cycle, taskId: selectedTaskId }
            });
          }
        }
      } catch (error: any) {
        outcome = "selection_failed";
        notes.push("Falha ao selecionar a próxima tarefa.");
        notes.push(error?.stderr?.toString?.() || error?.message || String(error));
        writeLogLine(logFile, "Roadmap task selection failed.");
        writeLogLine(logFile, error?.stderr?.toString?.() || error?.message || String(error));
      } finally {
        restoreBuildTask(buildTaskBackup);
        writeLogLine(logFile, "buildTask restored after cycle.");
      }
    }

    try {
      const approvalOutput = execStep(
        "npx tsx founder-command-center/agents/approvalGate.ts"
      );
      if (approvalOutput) writeLogLine(logFile, approvalOutput);
    } catch (error: any) {
      writeLogLine(logFile, "Approval gate failed or unavailable.");
      writeLogLine(logFile, error?.stderr?.toString?.() || error?.message || String(error));
    }

    syncGatewayState("overnight-cycle");

    const cycleResult: CycleResult = {
      cycle,
      startedAt: cycleStart.toISOString(),
      finishedAt: new Date().toISOString(),
      selectedTaskId,
      logFile,
      outcome,
      notes
    };

    report.cycles.push(cycleResult);
    report.summary.totalCycles += 1;
    if (outcome === "build_applied_autonomously") report.summary.autonomouslyApplied += 1;
    if (outcome === "build_failed" || outcome === "selection_failed") report.summary.failed += 1;
    if (outcome === "skipped_git_dirty") report.summary.skippedDirty += 1;
    if (outcome === "no_queued_tasks") report.summary.noQueuedTasks += 1;

    appendEvent({
      source: "overnight-self-build",
      type: "cycle_completed",
      summary: `ZEUS overnight cycle ${cycle} completed with outcome ${outcome}.`,
      data: cycleResult
    });

    writeLogLine(logFile, `---- cycle ${cycle} completed with ${outcome} ----`);

    if (new Date() >= endAt) {
      break;
    }

    sleep(intervalMinutes * 60 * 1000);
  }

  report.finishedAt = new Date().toISOString();
  const reportPath = writeOvernightReport(report);
  syncGatewayState("overnight-finished");

  appendEvent({
    source: "overnight-self-build",
    type: "overnight_finished",
    summary: "ZEUS overnight self-build finished.",
    data: {
      reportPath,
      summary: report.summary
    }
  });

  writeLogLine(logFile, `Overnight report written: ${reportPath}`);
  writeLogLine(logFile, "ZEUS overnight self-build finished.");

  // Generate morning report automatically after overnight completes
  writeLogLine(logFile, "Generating morning report.");
  try {
    const morningOutput = execStep(
      "npx tsx founder-command-center/zeus/zeusMorningReport.ts"
    );
    if (morningOutput) writeLogLine(logFile, morningOutput);
    writeLogLine(logFile, "Morning report generated successfully.");
  } catch (error: any) {
    writeLogLine(logFile, "Morning report generation failed.");
    writeLogLine(logFile, error?.stderr?.toString?.() || error?.message || String(error));
  }
}

main();
