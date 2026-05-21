import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";

const root = process.cwd();

export type ApolloReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  narrativeQuestion: string;
  corePromise: string;
  audience: string;
  proofPoints: string[];
  callToAction: string;
  toneAdvice: string;
  doNotSay: string[];
};

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function createReview(message: string, routed: RoutedIntent): ApolloReview {
  const id = `${Date.now()}-${safeFileName(message)}`;

  let narrativeQuestion =
    "Qual é a mensagem mais útil e mais clara para esta frente, sem inflacionar promessas?";
  let corePromise =
    "Clareza operacional, controlo e execução útil sem excesso de complexidade.";
  let audience = "Miguel ou um utilizador próximo do problema real.";
  let proofPoints = [
    "fluxo funcional já existente",
    "gates claros",
    "saída verificável"
  ];
  let callToAction = "Avançar para um próximo passo concreto e reversível.";
  let toneAdvice = "Direto, sóbrio, técnico e sem espetáculo.";
  let doNotSay = [
    "promessas de automação total",
    "linguagem grandiosa sem prova",
    "benefícios vagos sem mecanismo claro"
  ];

  switch (routed.intent) {
    case "website_project":
      narrativeQuestion =
        "Que promessa principal deve ser entendida na primeira leitura para justificar atenção e contacto?";
      corePromise =
        "A Arquimla reduz risco técnico e transforma complexidade dispersa em decisões claras e executáveis.";
      audience = "cliente que precisa de clareza, segurança técnica e orientação sólida.";
      proofPoints = [
        "estrutura clara de proposta ou serviço",
        "exemplos de leitura técnica e decisão",
        "prova de rigor e proteção de risco"
      ];
      callToAction = "Pedir uma conversa, diagnóstico ou próximo passo enquadrado.";
      toneAdvice = "Seguro, técnico, claro e sem marketing genérico.";
      doNotSay = [
        "promessas universais",
        "jargão vazio",
        "copy de agência indistinta"
      ];
      break;

    case "marketing_plan":
      narrativeQuestion =
        "Que mensagem merece repetição porque comunica valor real e diferenciação concreta?";
      corePromise =
        "Rigor técnico e clareza estratégica aplicados a problemas reais, sem ornamento desnecessário.";
      audience = "decisor que valoriza competência, filtragem e segurança de decisão.";
      proofPoints = [
        "casos concretos",
        "objeções respondidas com método",
        "demonstração de critério"
      ];
      callToAction = "Levar o público a uma pergunta concreta, não a um slogan abstrato.";
      toneAdvice = "Claro, assertivo e com prova, não volume.";
      doNotSay = [
        "conteúdo por conteúdo",
        "autoridade genérica",
        "frases inspiracionais sem substância"
      ];
      break;

    case "strategic_deliberation":
      narrativeQuestion =
        "Que formulação ajuda o Miguel a perceber rapidamente a direção recomendada sem ruído?";
      corePromise =
        "Uma recomendação curta, inteligível e ligada a prova operacional.";
      audience = "Miguel, no contexto de decisão e priorização.";
      proofPoints = [
        "critério explícito",
        "contraditório claro",
        "próximo passo verificável"
      ];
      callToAction = "Escolher a próxima ação segura.";
      toneAdvice = "Conciso, vivo e sem peso teatral.";
      doNotSay = [
        "explicações circulares",
        "repetição entre pareceres",
        "conclusões inchadas"
      ];
      break;
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    narrativeQuestion,
    corePromise,
    audience,
    proofPoints,
    callToAction,
    toneAdvice,
    doNotSay
  };
}

export function buildApolloReview(message: string, routed?: RoutedIntent): ApolloReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatApolloReview(review: ApolloReview): string {
  return [
    "APOLLO",
    "",
    `Questão de narrativa: ${review.narrativeQuestion}`,
    `Promessa central: ${review.corePromise}`,
    `Público: ${review.audience}`,
    "",
    "Provas a usar:",
    ...review.proofPoints.map((item) => `- ${item}`),
    "",
    `Call to action: ${review.callToAction}`,
    `Tom: ${review.toneAdvice}`,
    "",
    "Não dizer:",
    ...review.doNotSay.map((item) => `- ${item}`)
  ].join("\n");
}

function saveReview(review: ApolloReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "apollo");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    throw new Error('Usage: apolloNarrativeReview.ts "mensagem, oferta ou frente a clarificar"');
  }

  const review = buildApolloReview(message);
  const savedPath = saveReview(review);

  console.log(formatApolloReview(review));
  console.log("");
  console.log(`Apollo review saved: ${savedPath}`);
}

main();
