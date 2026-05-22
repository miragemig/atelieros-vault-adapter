import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();

const taskPath = path.join(
  root,
  "founder-command-center/runtime/buildTask.json"
);

const reportsPath = path.join(
  root,
  "founder-command-center/build-system/reports"
);

const quarantinePath = path.join(
  root,
  "founder-command-center/build-system/quarantine"
);

type BuildTask = {
  id: string;
  title: string;
  model: string;
  provider: string;
  mayGenerateCost: boolean;
  maxAttempts?: number;
  timeoutMs?: number;
  functionalTestCommand?: string;
  coreDestinationPath?: string;
  requirements: string[];
};

type StepResult = {
  step: string;
  status: "pass" | "fail";
  durationMs: number;
  output?: string;
  error?: string;
};

type BuildReport = {
  id: string;
  createdAt: string;
  status: "pass" | "fail";
  taskId: string;
  taskTitle: string;
  coreDestinationPath?: string;
  maxAttempts: number;
  timeoutMs: number;
  finalCandidatePath?: string;
  steps: StepResult[];
};

function loadTask(): BuildTask {
  if (!fs.existsSync(taskPath)) {
    throw new Error(`Missing buildTask.json at ${taskPath}`);
  }

  return JSON.parse(fs.readFileSync(taskPath, "utf-8")) as BuildTask;
}

function getShell(): string | undefined {
  return process.platform === "win32" ? "powershell.exe" : undefined;
}

function runCommand(step: string, command: string, timeoutMs: number): StepResult {
  const startedAt = Date.now();

  try {
    const output = execSync(command, {
      cwd: root,
      encoding: "utf-8",
      timeout: timeoutMs,
      shell: getShell(),
      env: {
        ...process.env,
        OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        OLLAMA_MODEL: process.env.OLLAMA_MODEL || "qwen2.5-coder:7b",
        ENABLE_PAID_APIS: "false",
        MAX_ADDITIONAL_COST_EUR: "0"
      }
    });

    const durationMs = Date.now() - startedAt;
    console.log(`PASS: ${step} (${durationMs}ms)`);

    return {
      step,
      status: "pass",
      durationMs,
      output
    };
  } catch (error: any) {
    const durationMs = Date.now() - startedAt;
    console.log(`FAIL: ${step} (${durationMs}ms)`);

    return {
      step,
      status: "fail",
      durationMs,
      output: error?.stdout?.toString?.(),
      error: error?.stderr?.toString?.() || error?.message || String(error)
    };
  }
}

function getLatestCleanCandidate(): string | undefined {
  if (!fs.existsSync(quarantinePath)) {
    return undefined;
  }

  const files = fs
    .readdirSync(quarantinePath)
    .filter((file) => file.endsWith(".clean.ts"))
    .map((file) => ({
      file,
      time: fs.statSync(path.join(quarantinePath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    return undefined;
  }

  return path.join(quarantinePath, files[0].file);
}

function writeReport(report: BuildReport) {
  fs.mkdirSync(reportsPath, { recursive: true });

  const reportPath = path.join(
    reportsPath,
    `build-report-${report.id}.json`
  );

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`Report written: ${reportPath}`);
}

function runValidation(report: BuildReport, label: string, task: BuildTask): boolean {
  report.steps.push(
    runCommand(
      label,
      "npx tsx founder-command-center/validation/validateLatestQuarantineDraft.ts",
      report.timeoutMs
    )
  );

  const structuralPassed = report.steps.at(-1)?.status === "pass";

  if (!structuralPassed) {
    return false;
  }

  if (!task.functionalTestCommand) {
    report.steps.push({
      step: `${label}-functional-test`,
      status: "fail",
      durationMs: 0,
      error: "Missing functionalTestCommand in buildTask.json"
    });

    return false;
  }

  report.steps.push(
    runCommand(
      `${label}-functional-test`,
      task.functionalTestCommand,
      report.timeoutMs
    )
  );

  const functionalPassed = report.steps.at(-1)?.status === "pass";

  if (functionalPassed) {
    report.status = "pass";
    report.finalCandidatePath = getLatestCleanCandidate();
    writeReport(report);
  }

  return functionalPassed;
}

function runBuildPipeline() {
  const task = loadTask();
  const id = String(Date.now());

  const maxAttempts = task.maxAttempts ?? 3;
  const timeoutMs = task.timeoutMs ?? 10 * 60 * 1000;

  const report: BuildReport = {
    id,
    createdAt: new Date().toISOString(),
    status: "fail",
    taskId: task.id,
    taskTitle: task.title,
    coreDestinationPath: task.coreDestinationPath,
    maxAttempts,
    timeoutMs,
    steps: []
  };

  report.steps.push(
    runCommand(
      "generate",
      "npx tsx founder-command-center/agents/ollamaBuildWorker.ts",
      timeoutMs
    )
  );

  if (report.steps.at(-1)?.status === "fail") {
    writeReport(report);
    process.exit(1);
  }

  if (runValidation(report, "validate-after-generate", task)) {
    return;
  }

  if (maxAttempts >= 2) {
    report.steps.push(
      runCommand(
        "repair-semantic",
        "npx tsx founder-command-center/agents/ollamaRepairWorker.ts",
        timeoutMs
      )
    );

    if (runValidation(report, "validate-after-semantic-repair", task)) {
      return;
    }
  }

  if (maxAttempts >= 3) {
    report.steps.push(
      runCommand(
        "repair-typescript",
        "npx tsx founder-command-center/agents/ollamaTypeScriptRepairWorker.ts",
        timeoutMs
      )
    );

    if (runValidation(report, "validate-after-typescript-repair", task)) {
      return;
    }
  }

  report.finalCandidatePath = getLatestCleanCandidate();
  writeReport(report);
  process.exit(1);
}

runBuildPipeline();
