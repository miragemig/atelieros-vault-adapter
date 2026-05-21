import fs from "fs";
import path from "path";

const buildQueuePath = path.join(
  process.cwd(),
  "founder-command-center/BUILD_QUEUE.md"
);

const activityPath = path.join(
  process.cwd(),
  "founder-command-center/activity/activity-stream.json"
);

function loadActivity() {
  return JSON.parse(fs.readFileSync(activityPath, "utf-8"));
}

function getLatestSuggestedAction() {
  const activity = loadActivity();

  return activity.find(
    (event: any) => event.status === "suggested"
  );
}

function runBuildQueueWriter() {
  const latest = getLatestSuggestedAction();

  if (!latest) {
    console.log("Nenhuma ação sugerida encontrada.");
    return;
  }

  const block = `

---

## Sugestão automática

### ${latest.title}

Prioridade: ${latest.priority}  
Projeto: ${latest.project}  
Origem: ${latest.source}  
Estado: suggested  

${latest.summary}

Criado em: ${latest.timestamp}
`;

  fs.appendFileSync(buildQueuePath, block, "utf-8");

  console.log("Build Queue atualizada com sugestão:");
  console.log(latest.summary);
}

runBuildQueueWriter();