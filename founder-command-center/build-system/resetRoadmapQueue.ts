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

function resetQueueFromTemplate() {
  // Read original template
  const template = JSON.parse(fs.readFileSync(queueTemplatePath, "utf-8"));
  
  // Reset all tasks to "queued" status
  const reset = {
    mode: template.mode,
    tasks: template.tasks.map((task: any) => ({
      ...task,
      status: "queued",
      startedAt: undefined,
      updatedAt: undefined
    }))
  };

  // Write reset state
  fs.mkdirSync(path.dirname(queueStatePath), { recursive: true });
  fs.writeFileSync(queueStatePath, JSON.stringify(reset, null, 2), "utf-8");
  
  console.log(`Queue reset: ${reset.tasks.length} tasks returned to "queued" status.`);
  console.log(`First task: ${reset.tasks[0].id} (priority ${reset.tasks[0].priority})`);
}

try {
  resetQueueFromTemplate();
} catch (error: any) {
  console.error("Queue reset failed:", error.message);
  process.exit(1);
}
