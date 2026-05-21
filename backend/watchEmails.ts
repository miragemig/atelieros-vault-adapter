import { normalizeWikiLinks } from "./linkParser";
import chokidar from "chokidar";
import fs from "fs";
import path from "path";

import { resolveEntity } from "./brains/canonical/resolveEntity";
import { analyzeContext, ProcessContext } from "./contextEngine";
import { decideNextAction } from "./actionEngine";

const watchPath = path.join(
  process.cwd(),
  "raw_sources",
  "emails"
);

const projectContext: ProcessContext = {
  processo: resolveEntity("Moradia Boavista"),
  cliente: resolveEntity("João Silva"),
  revisoesConsumidas: 3,
  revisoesIncluidas: 2,
  fase: "Licenciamento",
  honorariosAprovados: true,
  prazoEntregaDias: 4,
  blockers: [],
};

console.log("AtelierOS está a observar emails em:");
console.log(watchPath);

const watcher = chokidar.watch(watchPath, {
  persistent: true,
  ignoreInitial: true,
});

watcher.on("add", (filePath) => {
  if (!filePath.endsWith(".txt")) return;

  const email = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath, ".txt");

  const analysis = analyzeContext(projectContext, email);

  const action = decideNextAction({
    processo: projectContext.processo,
    cliente: projectContext.cliente,
    riscoContratual: analysis.riscoContratual,
    afectaHonorarios: analysis.afectaHonorarios,
    prioridade: analysis.prioridade,
    prazoDias: projectContext.prazoEntregaDias,
    blocker: false,
  });

  const processName = resolveEntity(projectContext.processo);
  const client = resolveEntity(projectContext.cliente);

  const markdown = `# Email Processado — ${fileName}

## Fonte
${filePath}

## Processo
[[${processName}]]

## Cliente
[[${client}]]

## Análise
- Assunto: ${analysis.assunto}
- Tipo: ${analysis.tipoPedido}
- Impacto: ${analysis.impacto}
- Risco contratual: ${analysis.riscoContratual ? "Sim" : "Não"}
- Afeta honorários: ${analysis.afectaHonorarios ? "Sim" : "Não"}
- Prioridade: ${analysis.prioridade}

## Próxima ação
${action.titulo}

${action.acao}

## Estado
Suggested

## Relações
- [[ScopeGuard]]
- [[Automation_Queue]]
- [[Inbox_Operacional]]
`;

  const outputPath = path.join(
    process.cwd(),
    "wiki",
    "AtelierOS-Wiki",
    `EMAIL_PROCESSED_${fileName}.md`
  );

  const normalizedMarkdown = normalizeWikiLinks(markdown);

fs.writeFileSync(outputPath, normalizedMarkdown, "utf-8");

  console.log("Email processado:");
  console.log(outputPath);
});