export interface AutomationTask {
  id: string;

  type:
    | "email_analysis"
    | "scopeguard"
    | "next_action"
    | "document_generation";

  title: string;

  status:
    | "suggested"
    | "accepted"
    | "rejected"
    | "applied";

  priority:
    | "baixa"
    | "media"
    | "alta"
    | "critica";

  createdAt: string;

  process: string;
}

export const automationQueue: AutomationTask[] = [];

export function addTask(
  task: AutomationTask
) {
  automationQueue.push(task);

  console.log(
    "Task adicionada:"
  );

  console.log(task);
}

export function listTasks() {
  return automationQueue;
}