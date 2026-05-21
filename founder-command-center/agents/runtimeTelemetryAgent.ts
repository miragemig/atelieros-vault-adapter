import fs from "fs";
import path from "path";

const runtimeStatePath = path.join(
  process.cwd(),
  "founder-command-center/runtime/runtime-state.json"
);

const activityPath = path.join(
  process.cwd(),
  "founder-command-center/activity/activity-stream.json"
);

const proposalsPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/proposals"
);

const approvedPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/approved"
);

const executionPlansPath = path.join(
  process.cwd(),
  "founder-command-center/build-system/execution-plans"
);

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function countFiles(folderPath: string) {
  if (!fs.existsSync(folderPath)) return 0;

  return fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".md"))
    .length;
}

function runRuntimeTelemetryAgent() {
  const runtime = readJson(runtimeStatePath);
  const activity = readJson(activityPath);

  const telemetry = {
    lastTelemetryUpdate: new Date().toISOString(),
    activityEvents: activity.length,
    pendingProposals: countFiles(proposalsPath),
    approvedProposals: countFiles(approvedPath),
    executionPlans: countFiles(executionPlansPath),
    runtimeHealth:
      runtime.criticalWarnings && runtime.criticalWarnings.length > 0
        ? "warning"
        : "ok"
  };

  const updatedRuntime = {
    ...runtime,
    telemetry,
    cycleCount: (runtime.cycleCount ?? 0) + 1,
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(
    runtimeStatePath,
    JSON.stringify(updatedRuntime, null, 2),
    "utf-8"
  );

  console.log("Runtime telemetry updated:");
  console.log(telemetry);
}

runRuntimeTelemetryAgent();