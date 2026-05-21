import fs from "fs";
import path from "path";

import { validateEvent } from "../../shared/validation/validateEvent";
import { triageSignal } from "./triageAgent";

const inboxPath = path.join(process.cwd(), "founder-command-center/support/inbox");
const processedPath = path.join(process.cwd(), "founder-command-center/support/processed");
const activityPath = path.join(process.cwd(), "founder-command-center/activity/activity-stream.json");
const buildQueuePath = path.join(process.cwd(), "founder-command-center/BUILD_QUEUE.md");

function loadActivity() {
  return JSON.parse(fs.readFileSync(activityPath, "utf-8"));
}

function saveActivity(activity: any) {
  fs.writeFileSync(activityPath, JSON.stringify(activity, null, 2), "utf-8");
}

function appendBuildQueue(ticketName: string, triage: any, content: string) {
  const current = fs.readFileSync(buildQueuePath, "utf-8");

  if (current.includes(`Ticket: ${ticketName}`)) {
    console.log("Ticket already exists in Build Queue:", ticketName);
    return;
  }

  if (triage.category === "archive_only") {
    console.log("Archive-only ticket. Not added to Build Queue:", ticketName);
    return;
  }

  const block = `

---

## Support Ticket Analysis

Prioridade: ${triage.priority}  
Origem: Support Agent + Triage Agent  
Estado: suggested  
Ticket: ${ticketName}  
Categoria: ${triage.category}  
Explicação: ${triage.explanation}  
Sinais detetados: ${triage.matchedSignals.join(", ") || "nenhum"}  
Requer humano: ${triage.requiresHuman ? "sim" : "não"}  
Criar memória: ${triage.shouldCreateMemory ? "sim" : "não"}  
Notificar: ${triage.shouldNotify ? "sim" : "não"}

### Resumo

${content.trim()}

### Ação sugerida

${triage.suggestedAction}

Criado em: ${new Date().toISOString()}
`;

  fs.appendFileSync(buildQueuePath, block, "utf-8");
}

function createActivityEvent(ticketName: string, triage: any) {
  const event = {
    id: `event_${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: "SupportAgent",
    type: "ticket_received",
    title: `Support ticket triaged: ${ticketName}`,
    summary: triage.suggestedAction,
    project: "AtelierOS",
    priority: triage.priority,
    status: "suggested"
  };

  const validation = validateEvent(event);

  if (!validation.valid) {
    throw new Error("Invalid support event. Event was not written.");
  }

  const activity = loadActivity();
  activity.unshift(event);
  saveActivity(activity);
}

function processTicket(fullPath: string) {
  if (!fs.existsSync(fullPath)) return;

  const file = path.basename(fullPath);
  const content = fs.readFileSync(fullPath, "utf-8").trim();

  if (!content) {
    console.log("Ignoring empty ticket:", file);
    return;
  }

  const triage = triageSignal(content);

  createActivityEvent(file, triage);
  appendBuildQueue(file, triage, content);

  fs.renameSync(fullPath, path.join(processedPath, file));

  console.log("Support ticket triaged:", file);
  console.log(triage);
}

function runSupportAgent() {
  const targetFile = process.argv[2];

  if (targetFile) {
    processTicket(targetFile);
    return;
  }

  const files = fs.readdirSync(inboxPath).filter((file) => file.endsWith(".txt"));

  if (files.length === 0) {
    console.log("No support tickets found.");
    return;
  }

  for (const file of files) {
    processTicket(path.join(inboxPath, file));
  }
}

runSupportAgent();