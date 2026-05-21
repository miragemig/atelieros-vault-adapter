import fs from "fs";
import path from "path";
import { classifyPatchOrBuildTask } from "../patch-system/patchErrorClassifier";

const root = process.cwd();

const queueStatePath = path.join(
  root,
  "founder-command-center/runtime/roadmapQueueState.json"
);

function main() {
  const taskId = process.argv[2];

  if (!taskId) {
    throw new Error("Usage: classifyRoadmapTask.ts <task-id>");
  }

  if (!fs.existsSync(queueStatePath)) {
    throw new Error("roadmapQueueState.json not found.");
  }

  const queue = JSON.parse(fs.readFileSync(queueStatePath, "utf-8"));
  const task = queue.tasks.find((item: any) => item.id === taskId);

  if (!task) {
    throw new Error(`Roadmap task not found: ${taskId}`);
  }

  const result = classifyPatchOrBuildTask({
    id: task.id,
    title: task.title,
    requirements: task.buildTask?.requirements || [],
    targetFiles: task.buildTask?.targetFiles || [],
    errorText: JSON.stringify(task.buildTask || {})
  });

  console.log(`Task classification: ${result.classification}`);
  console.log(`Recommended worker: ${result.recommendedWorker}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Reasons: ${result.reasons.join(" | ")}`);
}

main();
