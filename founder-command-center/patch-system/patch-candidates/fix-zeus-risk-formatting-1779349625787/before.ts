import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getAgentsByIds } from "../olympus/agentRegistry";
import { RoutedIntent } from "./zeusIntentRouter";

const root = process.cwd();

function safeExec(command: string): string {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf-8"
    }).trim();
  } catch {
    return "";
  }
}

function latestFile(dirPath: string, extension: string): string | null {
  if (!fs.existsSync(dirPath)) return null;

  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(extension))
    .map((file) => ({
      file,
      fullPath: path.join(dirPath, file),
      time: fs.statSync(path.join(dirPath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  return files[0]?.fullPath || null;
}

export function readOperationalContext() {
  const reportsPath = path.join(root, "founder-command-center/build-system/reports");
  const buildTaskPath = path.join(root, "founder-command-center/build-system/buildTask.json");

  const latestReportPath = latestFile(reportsPath, ".json");
  const latestReport = latestReportPath && fs.existsSync(latestReportPath)
    ? JSON.parse(fs.readFileSync(latestReportPath, "utf-8"))
    : null;

  const buildTask = fs.existsSync(buildTaskPath)
    ? JSON.parse(fs.readFileSync(buildTaskPath, "utf-8"))
    : null;

  return {
    gitStatus: safeExec("git status --short") || "clean",
    gitLog: safeExec("git log --oneline -5"),
    latestReport,
    latestReportPath,
    buildTask
  };
}

function inferMatters(intent: string): string[] {
  if (intent === "strategic_deliberation") {
    return [
      "priorização estratégica",
      "maturidade técnica",
      "risco de dispersão",
      "valor de feedback imediato",
      "controlo operacional"
    ];
  }

  if (intent === "website_project") {
    return [
      "posicionamento",
      "comunicação",
      "conversão",
      "UX",
      "risco de execução prematura"
    ];
  }

  if (intent === "marketing_plan") {
    return [
      "posicionamento",
      "público-alvo",
      "proposta de valor",
      "canais",
      "métricas"
    ];
  }

  if (intent === "build_pipeline") {
    return [
      "engenharia",
      "validação",
      "testes funcionais",
      "governança",
      "risco técnico"
    ];
  }

  return [
    "interpretação do pedido",
    "risco",
    "prioridade",
    "próxima ação segura"
  ];
}

function optionsFor(intent: string, message: string): string[] {
  if (intent === "strategic_deliberation") {
    return [
      "Continuar a endurecer o build system: aumenta robustez, mas mantém o ZEUS menos visível/interativo.",
      "Avançar para uma UI completa: dá sensação de produto, mas abre uma frente grande e pode virar fachada.",
      "Criar uma ZEUS Console v0.1 mínima: dá interação imediata sem abandonar a disciplina técnica."
    ];
  }

  if (intent === "website_project") {
    return [
      "Não criar projeto nem ficheiros: apenas clarificar objetivo e posicionamento.",
      "Criar uma deliberação escrita em proposals: útil para rever sem comprometer estrutura.",
      "Adiar qualquer execução até existir brief mínimo aprovado."
    ];
  }

  if (intent === "marketing_plan") {
    return [
      "Definir primeiro público e promessa central.",
      "Criar apenas um plano em draft, sem calendário operacional ainda.",
      "Recolher referências e objeções antes de produzir conteúdo."
    ];
  }

  return [
    "Responder apenas com análise.",
    "Pedir informação em falta.",
    "Propor próxima ação segura sem execução."
  ];
}

function risksFor(intent: string, gitStatus: string): string[] {
  const risks: string[] = [];

  if (gitStatus !== "clean") {
    risks.push("O Git não está limpo. Qualquer execução persistente deve ficar bloqueada.");
  }

  if (intent === "strategic_deliberation") {
    risks.push("Escolher UI completa cedo demais pode criar uma superfície bonita sem motor suficientemente sólido.");
    risks.push("Continuar só no build system pode manter o ZEUS invisível e reduzir feedback emocional/operacional.");
    risks.push("Abrir demasiadas frentes ao mesmo tempo degrada foco e aumenta dívida técnica.");
  }

  if (intent === "website_project") {
    risks.push("Executar design ou código antes de definir objetivo, público e conversão é desperdício.");
    risks.push("Misturar marcas/produtos/visões numa só frente cria ruído estratégico.");
  }

  if (intent === "marketing_plan") {
    risks.push("Produzir conteúdo sem posicionamento cria volume, não tração.");
  }

  if (risks.length === 0) {
    risks.push("Risco baixo nesta fase, desde que nenhuma ação persistente seja executada.");
  }

  return risks;
}

function preliminaryJudgement(intent: string): string {
  if (intent === "strategic_deliberation") {
    return [
      "Não recomendo escolher entre build system e UI como se fossem caminhos exclusivos.",
      "A decisão correta é uma terceira via: criar uma ZEUS Console v0.1 mínima, ligada ao estado real, sem abrir uma frente pesada de frontend.",
      "Isso dá interação ao Miguel e mantém a disciplina do sistema."
    ].join(" ");
  }

  if (intent === "website_project") {
    return "Não se deve criar projeto, design ou código nesta fase. A ação correta é clarificar posicionamento e objetivo em modo deliberativo.";
  }

  if (intent === "marketing_plan") {
    return "Não se deve produzir calendário de conteúdos ainda. Primeiro é obrigatório fixar público, promessa e tese comercial.";
  }

  return "A resposta deve permanecer deliberativa. Sem execução persistente nesta fase.";
}

function recommendedNextStep(intent: string): string {
  if (intent === "strategic_deliberation") {
    return "Criar ZEUS Console v0.1 mínima: terminal/browser simples, estado real, chat com ZEUS, sem execução crítica.";
  }

  if (intent === "website_project") {
    return "Responder a três perguntas: objetivo, público-alvo e resultado esperado. Sem criar ficheiros.";
  }

  if (intent === "marketing_plan") {
    return "Definir produto/serviço, público-alvo e promessa central antes de qualquer plano.";
  }

  return "Manter deliberação, pedir informação em falta e evitar execução.";
}

export function createZeusResponse(message: string, routed: RoutedIntent): string {
  const agents = getAgentsByIds(routed.olympusAgentIds);
  const context = readOperationalContext();

  const olympus = agents
    .map((agent) => `- ${agent.name}: ${agent.title}`)
    .join("\n");

  const matters = inferMatters(routed.intent).map((item) => `- ${item}`).join("\n");
  const options = optionsFor(routed.intent, message).map((item, index) => `${index + 1}. ${item}`).join("\n");
  const risks = risksFor(routed.intent, context.gitStatus).map((item) => `- ${item}`).join("\n");

  const latestReportStatus = context.latestReport?.status || "unknown";
  const currentTask = context.buildTask?.id || "unknown";

  return [
    "ZEUS",
    "",
    `Intenção detetada: ${routed.intent}`,
    `Confiança: ${routed.confidence}`,
    `Motivo: ${routed.reason}`,
    "",
    "Questão a decidir:",
    `Como responder ao pedido do Miguel: "${message}" sem executar ações prematuras.`,
    "",
    "Matérias envolvidas:",
    matters,
    "",
    "Estado operacional:",
    `- Git: ${context.gitStatus}`,
    `- Última task: ${currentTask}`,
    `- Último report: ${latestReportStatus}`,
    "",
    "Olympus convocado:",
    olympus || "- Nenhum agente convocado.",
    "",
    "Opções:",
    options,
    "",
    "Riscos / contraditório:",
    risks,
    "",
    "Parecer preliminar de ZEUS:",
    preliminaryJudgement(routed.intent),
    "",
    "Recomendação:",
    recommendedNextStep(routed.intent),
    "",
    "Modo atual:",
    "DELIBERATION_ONLY. Nenhum projeto será criado. Nenhum ficheiro persistente deve ser criado por aprovação. O ZEUS pode deliberar, propor e rever."
  ].join("\n");
}
