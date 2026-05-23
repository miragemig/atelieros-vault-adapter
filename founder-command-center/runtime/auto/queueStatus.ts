import fs from "fs";
import path from "path";

const ROOT = "G:\\ZEUS";
const QUEUE_PATH = path.join(ROOT, "founder-command-center/runtime/queue/tasks.json");

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) {
    console.error(`Queue not found: ${QUEUE_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(QUEUE_PATH, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function main() {
  const queue = loadQueue();
  const tasks = queue.tasks || [];

  const counts = tasks.reduce((acc: any, task: any) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  console.log("ZEUS QUEUE STATUS");
  console.log(`Queue: ${QUEUE_PATH}`);
  console.log(`Total tasks: ${tasks.length}`);
  console.log("");

  console.log("Counts:");
  for (const [status, count] of Object.entries(counts)) {
    console.log(`- ${status}: ${count}`);
  }

  console.log("");
  console.log("Tasks:");

  for (const task of tasks) {
    console.log(`- ${task.id}`);
    console.log(`  status: ${task.status}`);
    console.log(`  type: ${task.type}`);
    console.log(`  goal: ${task.goal}`);
    console.log(`  report: ${task.report || ""}`);
    console.log("");
  }
}

main();
