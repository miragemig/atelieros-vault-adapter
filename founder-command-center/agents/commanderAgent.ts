import fs from "fs";
import path from "path";

import { validateEvent } from "../../shared/validation/validateEvent";
import { checkMemoryIntegrity } from "../../shared/memory/memoryIntegrity";

const runtimePath = path.join(
  process.cwd(),
  "founder-command-center/runtime/runtime-state.json"
);

const activityPath = path.join(
  process.cwd(),
  "founder-command-center/activity/activity-stream.json"
);

function loadRuntime() {
  return JSON.parse(fs.readFileSync(runtimePath, "utf-8"));
}

function loadActivity() {
  return JSON.parse(fs.readFileSync(activityPath, "utf-8"));
}

function createActivityEvent(event: any) {
  const validation = validateEvent(event);

  if (!validation.valid) {
    throw new Error("Invalid activity event. Event was not written.");
  }

  const activity = loadActivity();

  activity.unshift(event);

  fs.writeFileSync(
    activityPath,
    JSON.stringify(activity, null, 2),
    "utf-8"
  );
}

function runCommander() {
  const runtime = loadRuntime();

  console.log("\n=== Founder Command Center ===\n");

  console.log("System:", runtime.systemName);
  console.log("Version:", runtime.version);
  console.log("Status:", runtime.status);

  console.log("\nCurrent Focus:");
  console.log(runtime.currentFocus);

  console.log("\nActive Agents:");
  runtime.activeAgents.forEach((agent: string) => {
    console.log("-", agent);
  });

  const memoryCheck = checkMemoryIntegrity([
    "Moradia_Boavista",
    "Moradia_Moradia_Boavista",
    "Joao_Silva"
  ]);

  console.log("\nMemory Integrity:");
  console.log(memoryCheck);

  if (!memoryCheck.valid) {
    console.log("\nWARNING: Memory integrity issues detected.");
  }

  const event = {
    id: `event_${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: "CommanderAgent",
    type: "agent_executed",
    title: "Commander Agent executed",
    summary: memoryCheck.valid
      ? "Commander reviewed runtime state successfully."
      : "Commander detected memory integrity issues.",
    project: "AtelierOS",
    priority: memoryCheck.valid ? "media" : "alta",
    status: "done"
  };

  createActivityEvent(event);

  console.log("\nActivity stream updated with validated event.");
}

runCommander();