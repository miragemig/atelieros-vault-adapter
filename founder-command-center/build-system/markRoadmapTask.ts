import fs from "fs";
import path from "path";

const root = process.cwd();

const queueStatePath = path.join(
  root,
  "founder-command-center/runtime/roadmapQueueState.json"
);

function main() {
  const [taskId, status] = process.argv.slice(2);

  if (!taskId || !status) {
    throw new Error("Usage: markRoadmapTask.ts <task-id> <status>");
  }

  if (!fs.existsSync(queueStatePath)) {
    throw new Error("Missing roadmap queue state.");
  }

  const queue = JSON.parse(fs.readFileSync(queueStatePath, "utf-8"));
  const task = queue.tasks.find((item: any) => item.id === taskId);

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  task.status = status;
  task.updatedAt = new Date().toISOString();

  if (status === "waiting_review") {
    task.completedAt = new Date().toISOString();
  }

  fs.writeFileSync(queueStatePath, JSON.stringify(queue, null, 2), "utf-8");

  console.log(`Roadmap task ${taskId} marked as ${status}`);
}

main();
