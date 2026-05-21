import {
  addTask,
  listTasks,
} from "./automationQueue";

addTask({
  id: "task_001",

  type: "scopeguard",

  title:
    "Validar alteração extra cozinha",

  status: "suggested",

  priority: "critica",

  createdAt:
    new Date().toISOString(),

  process: "Moradia_Boavista",
});

console.log(
  listTasks()
);