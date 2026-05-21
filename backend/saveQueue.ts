import fs from "fs";
import path from "path";
import { addTask, listTasks } from "./automationQueue";

addTask({
  id: "task_001",
  type: "scopeguard",
  title: "Validar alteração extra cozinha",
  status: "suggested",
  priority: "critica",
  createdAt: new Date().toISOString(),
  process: "Moradia_Boavista",
});

const tasks = listTasks();

const markdown = `# Automation Queue

## Estado
Fila operacional do AtelierOS.

## Tarefas

${tasks
  .map(
    (t) => `### ${t.id} — ${t.title}

- Tipo: ${t.type}
- Estado: ${t.status}
- Prioridade: ${t.priority}
- Criado em: ${t.createdAt}
- Processo: [[${t.process}]]

`
  )
  .join("\n")}
`;

const outputPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  "Automation_Queue.md"
);

fs.writeFileSync(outputPath, markdown, "utf-8");

console.log("Automation Queue guardada em:");
console.log(outputPath);