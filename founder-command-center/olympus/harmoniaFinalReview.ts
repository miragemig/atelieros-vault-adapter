import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";

const root = process.cwd();

export type HarmoniaReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  readiness: "low" | "medium" | "high";
  coherenceVerdict: string;
  strengths: string[];
  tensions: string[];
  missingPieces: string[];
  releaseAdvice: string;
};

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function createReview(message: string, routed: RoutedIntent): HarmoniaReview {
  const id = `${Date.now()}-${safeFileName(message)}`;

  let readiness: HarmoniaReview["readiness"] = "medium";
  let coherenceVerdict =
    "A resposta pode ser útil, mas precisa de garantir que decisão, risco e próxima ação aparecem sem se atropelarem.";
  let strengths = [
    "A intenção já está enquadrada.",
    "Existe uma próxima ação plausível.",
    "O pedido pode ser respondido sem execução prematura."
  ];
  let tensions = [
    "A resposta pode misturar análise, decisão e execução em excesso.",
    "Pode faltar uma hierarquia clara entre o essencial e o acessório."
  ];
  let missingPieces = [
    "um critério claro de decisão",
    "um contraditório explícito",
    "uma recomendação curta e acionável"
  ];
  let releaseAdvice =
    "Entregar só quando a conclusão estiver clara, a ação segura for inequívoca e o resto tiver sido comprimido.";

  switch (routed.intent) {
    case "strategic_deliberation":
      readiness = "high";
      coherenceVerdict =
        "A deliberação estratégica está pronta quando separa bem critério, contraditório e sequência recomendada.";
      strengths = [
        "Há espaço para distinguir Athena, Ares e Mnemosyne sem redundância.",
        "O pedido admite uma recomendação nítida.",
        "A decisão pode ser entregue em formato compacto."
      ];
      tensions = [
        "Se houver demasiadas frentes, a resposta perde força.",
        "Se a recomendação repetir o contraditório, a conclusão fica difusa."
      ];
      missingPieces = [
        "uma ordem de prioridade inequívoca",
        "um corte claro do que não fazer já"
      ];
      releaseAdvice =
        "Entregar como decisão curta com apoio dos pareceres, sem transformar a resposta num relatório longo.";
      break;

    case "website_project":
    case "marketing_plan":
      readiness = "medium";
      coherenceVerdict =
        "A resposta só está pronta se deixar claro que o problema ainda é de clarificação e não de execução.";
      strengths = [
        "É possível proteger foco e evitar trabalho prematuro.",
        "A recomendação pode recentrar em posicionamento."
      ];
      tensions = [
        "A resposta pode parecer genérica se não fixar um próximo passo concreto.",
        "A linguagem pode escorregar para brainstorming excessivo."
      ];
      missingPieces = [
        "pergunta ou critério de clarificação central",
        "próximo passo comercial concreto"
      ];
      releaseAdvice =
        "Só entregar quando o output apontar para clarificação executável e não para produção difusa.";
      break;

    case "build_pipeline":
    case "software_project":
    case "automation_project":
      readiness = "high";
      coherenceVerdict =
        "A resposta está pronta se reduzir o problema a uma correção mínima validável, sem fantasia arquitetural.";
      strengths = [
        "O sistema já permite separar patch, runtime e deliberação.",
        "A próxima ação pode ser claramente verificável."
      ];
      tensions = [
        "Pode haver excesso de superfície para o estado atual do motor.",
        "A resposta perde coerência se recomendar expansão e consolidação ao mesmo tempo."
      ];
      missingPieces = [
        "uma única prioridade técnica",
        "critério de validação do passo seguinte"
      ];
      releaseAdvice =
        "Entregar só quando o próximo passo estiver reduzido a um fluxo mínimo verificável.";
      break;
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    readiness,
    coherenceVerdict,
    strengths,
    tensions,
    missingPieces,
    releaseAdvice
  };
}

export function buildHarmoniaReview(message: string, routed?: RoutedIntent): HarmoniaReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatHarmoniaReview(review: HarmoniaReview): string {
  return [
    "HARMONIA",
    "",
    `Prontidão: ${review.readiness}`,
    `Veredito: ${review.coherenceVerdict}`,
    "",
    "Forças:",
    ...review.strengths.map((item) => `- ${item}`),
    "",
    "Tensões:",
    ...review.tensions.map((item) => `- ${item}`),
    "",
    "Faltas antes de entregar:",
    ...review.missingPieces.map((item) => `- ${item}`),
    "",
    `Conselho final: ${review.releaseAdvice}`
  ].join("\n");
}

function saveReview(review: HarmoniaReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "harmonia");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    throw new Error('Usage: harmoniaFinalReview.ts "texto ou deliberação a rever"');
  }

  const review = buildHarmoniaReview(message);
  const savedPath = saveReview(review);

  console.log(formatHarmoniaReview(review));
  console.log("");
  console.log(`Harmonia review saved: ${savedPath}`);
}

main();
