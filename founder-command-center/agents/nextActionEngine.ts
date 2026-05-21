import fs from "fs";
import path from "path";

const roadmapPath = path.join(
  process.cwd(),
  "founder-command-center/roadmap/roadmap.json"
);

const activityPath = path.join(
  process.cwd(),
  "founder-command-center/activity/activity-stream.json"
);

function loadRoadmap() {
  return JSON.parse(fs.readFileSync(roadmapPath, "utf-8"));
}

function loadActivity() {
  return JSON.parse(fs.readFileSync(activityPath, "utf-8"));
}

function saveActivity(activity: any) {
  fs.writeFileSync(activityPath, JSON.stringify(activity, null, 2), "utf-8");
}

function runNextActionEngine() {
  console.log("\n=== NEXT ACTION ENGINE ===\n");

  const roadmap = loadRoadmap();

  const activePhase = roadmap.phases.find(
    (phase: any) => phase.status === "active"
  );

  if (!activePhase) {
    console.log("No active roadmap phase found.");
    return;
  }

  console.log("Active Phase:", activePhase.name);

  const nextTask = activePhase.tasks.find(
    (task: any) => task.status === "active" || task.status === "todo"
  );

  if (!nextTask) {
    console.log("All tasks completed in this phase.");
    return;
  }

  console.log("Suggested Next Action:", nextTask.title);

  const activity = loadActivity();

  const event = {
    id: `event_${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: "NextActionEngine",
    type: "roadmap_updated",
    title: "Next action proposed",
    summary: nextTask.title,
    project: "AtelierOS",
    priority: nextTask.priority ?? "alta",
    status: "suggested"
  };

  activity.unshift(event);
  saveActivity(activity);

  console.log("\nActivity stream updated.");
}

runNextActionEngine();
