import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";

const root = process.cwd();

export type AphroditeReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  firstImpression: string;
  attractiveSignals: string[];
  frictionPoints: string[];
  humanResonance: string;
  recommendation: string;
};

function safeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

function createReview(message: string, routed: RoutedIntent): AphroditeReview {
  let firstImpression =
    "A experiência deve transmitir utilidade, controlo e clareza antes de tentar parecer grandiosa.";
  let attractiveSignals = [
    "frase simples que explica valor real",
    "superfície visual contida e intencional",
    "sensação de competência sem ruído"
  ];
  let frictionPoints = [
    "excesso de texto antes da prova",
    "interface pesada sem gesto claro",
    "promessa maior do que o mecanismo real"
  ];
  let humanResonance =
    "O utilizador deve sentir que o sistema o ajuda a decidir e agir, não que o impressiona à distância.";
  let recommendation =
    "Melhorar a desirability através de clareza, ritmo e prova visível, não por decoração.";

  if (routed.intent === "website_project" || routed.intent === "marketing_plan") {
    firstImpression =
      "A primeira leitura deve transmitir credibilidade, nitidez e valor prático sem linguagem genérica.";
  }

  return {
    id: `${Date.now()}-${safeFileName(message)}`,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    firstImpression,
    attractiveSignals,
    frictionPoints,
    humanResonance,
    recommendation
  };
}

export function buildAphroditeReview(message: string, routed?: RoutedIntent): AphroditeReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatAphroditeReview(review: AphroditeReview): string {
  return [
    "APHRODITE",
    "",
    `Primeira impressão: ${review.firstImpression}`,
    "",
    "Sinais de atração:",
    ...review.attractiveSignals.map((item) => `- ${item}`),
    "",
    "Fricções:",
    ...review.frictionPoints.map((item) => `- ${item}`),
    "",
    `Ressonância humana: ${review.humanResonance}`,
    `Recomendação: ${review.recommendation}`
  ].join("\n");
}

function saveReview(review: AphroditeReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "aphrodite");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();
  if (!message) {
    throw new Error('Usage: aphroditeExperienceReview.ts "experiência, mensagem ou interface a avaliar"');
  }
  const review = buildAphroditeReview(message);
  const savedPath = saveReview(review);
  console.log(formatAphroditeReview(review));
  console.log("");
  console.log(`Aphrodite review saved: ${savedPath}`);
}

main();
