import fs from "fs";
import path from "path";

const root = process.cwd();

const queueTemplatePath = path.join(
  root,
  "founder-command-center/build-system/roadmapQueue.json"
);

const queueStatePath = path.join(
  root,
  "founder-command-center/runtime/roadmapQueueState.json"
);

const buildTaskPath = path.join(
  root,
  "founder-command-center/build-system/buildTask.json"
);

function ensureState() {
  fs.mkdirSync(path.dirname(queueStatePath), { recursive: true });

  if (!fs.existsSync(queueStatePath)) {
    fs.copyFileSync(queueTemplatePath, queueStatePath);
  }
}

function main() {
  ensureState();

  const queue = JSON.parse(fs.readFileSync(queueStatePath, "utf-8"));

  const nextTask = queue.tasks
    .filter((task: any) => task.status === "queued")
    .sort((a: any, b: any) => a.priority - b.priority)[0];

  if (!nextTask) {
    console.log("No queued roadmap tasks.");
    process.exit(2);
  }

  nextTask.status = "in_progress";
  nextTask.startedAt = new Date().toISOString();

  fs.writeFileSync(buildTaskPath, JSON.stringify(nextTask.buildTask, null, 2), "utf-8");
  fs.writeFileSync(queueStatePath, JSON.stringify(queue, null, 2), "utf-8");

  console.log(`Selected roadmap task: ${nextTask.id}`);
}

main();
