import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";

const root = process.cwd();

export type ArgusReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  watchQuestion: string;
  watchTargets: string[];
  signalTypes: string[];
  cadence: string;
  guardrails: string[];
  firstSafeWatch: string;
};

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function createReview(message: string, routed: RoutedIntent): ArgusReview {
  const id = `${Date.now()}-${safeFileName(message)}`;

  let watchQuestion =
    "Que observação externa ajudaria a decidir melhor sem criar ruído nem abrir uma frente de monitorização excessiva?";
  let watchTargets = [
    "fontes públicas de referência",
    "ferramentas comparáveis",
    "mudanças relevantes no ecossistema"
  ];
  let signalTypes = [
    "alterações de produto",
    "mudanças de workflow",
    "novos padrões úteis"
  ];
  let cadence = "manual ou semanal, nunca contínua por defeito";
  let guardrails = [
    "só fontes públicas",
    "sem túneis públicos",
    "sem APIs pagas",
    "sem watchers ruidosos sem aprovação"
  ];
  let firstSafeWatch =
    "Criar um watch pequeno, manual e com poucos alvos antes de automatizar qualquer recolha.";

  switch (routed.intent) {
    case "strategic_deliberation":
      watchQuestion =
        "Que sinais externos ajudariam a perceber se a direção do ZEUS está alinhada com padrões úteis ou se está a reinventar sem necessidade?";
      watchTargets = [
        "assistentes operacionais e agentes locais",
        "consoles de comando e runtime HUDs",
        "padrões públicos de approval-gating"
      ];
      signalTypes = [
        "padrões de interação que reduzem carga mental",
        "formas simples de mostrar estado e próxima ação",
        "soluções práticas para gates e execução controlada"
      ];
      cadence = "manual no início; semanal apenas se houver valor claro";
      firstSafeWatch =
        "Observar 3 a 5 referências públicas e resumir só os padrões reutilizáveis, sem copiar implementação.";
      break;

    case "website_project":
    case "marketing_plan":
      watchQuestion =
        "Que sinais externos ajudam a afinar posicionamento e proposta sem transformar a observação em procrastinação?";
      watchTargets = [
        "sites de referência do setor",
        "casos de estudo públicos",
        "mensagens de oferta de concorrência comparável"
      ];
      signalTypes = [
        "estrutura de prova",
        "clareza de headline",
        "formas de converter contacto em ação"
      ];
      cadence = "pontual por decisão, não vigilância contínua";
      firstSafeWatch =
        "Comparar um pequeno conjunto de referências e extrair só diferenças úteis para posicionamento.";
      break;

    case "software_project":
    case "automation_project":
    case "build_pipeline":
      watchQuestion =
        "Que sinais externos reduzem engenharia desnecessária e revelam padrões práticos já testados?";
      watchTargets = [
        "repos públicos relevantes",
        "ferramentas open source comparáveis",
        "padrões públicos de runtime e patch systems"
      ];
      signalTypes = [
        "separação de módulos",
        "estrutura de logs e candidates",
        "guardrails de execução"
      ];
      cadence = "manual por necessidade técnica, não scraping contínuo";
      firstSafeWatch =
        "Levantar poucas referências públicas e registar só padrões funcionais aproveitáveis.";
      break;
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    watchQuestion,
    watchTargets,
    signalTypes,
    cadence,
    guardrails,
    firstSafeWatch
  };
}

export function buildArgusReview(message: string, routed?: RoutedIntent): ArgusReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatArgusReview(review: ArgusReview): string {
  return [
    "ARGUS",
    "",
    `Questão de watch: ${review.watchQuestion}`,
    "",
    "Alvos a observar:",
    ...review.watchTargets.map((item) => `- ${item}`),
    "",
    "Sinais relevantes:",
    ...review.signalTypes.map((item) => `- ${item}`),
    "",
    `Cadência: ${review.cadence}`,
    "",
    "Guardrails:",
    ...review.guardrails.map((item) => `- ${item}`),
    "",
    `Primeiro watch seguro: ${review.firstSafeWatch}`
  ].join("\n");
}

function saveReview(review: ArgusReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "argus");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    throw new Error('Usage: argusExternalWatch.ts "tema ou frente a observar"');
  }

  const review = buildArgusReview(message);
  const savedPath = saveReview(review);

  console.log(formatArgusReview(review));
  console.log("");
  console.log(`Argus review saved: ${savedPath}`);
}

main();
