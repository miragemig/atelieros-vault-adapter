import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";
import { readOperationalContext } from "../chat/zeusOperationalContext";

const root = process.cwd();

export type HephaestusReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  buildQuestion: string;
  smallestBuildableUnit: string;
  validationPath: string[];
  implementationBoundary: string;
  notNow: string[];
  recommendation: string;
};

function safeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

function createReview(message: string, routed: RoutedIntent): HephaestusReview {
  const context = readOperationalContext();
  let buildQuestion =
    "Qual é a menor peça realmente buildable que aumenta capacidade do ZEUS sem abrir uma frente demasiado larga?";
  let smallestBuildableUnit =
    "uma intervenção estreita, auditável e validável ponta a ponta no fluxo principal";
  let validationPath = [
    "preparar candidate ou artefacto verificável",
    "validar localmente sem tocar ações críticas",
    "pedir aprovação antes de aplicar ao core"
  ];
  let implementationBoundary =
    "Não reescrever arquitetura quando o problema pede uma melhoria estreita e comprovável.";
  let notNow = [
    "framework novo sem prova",
    "reescrita ampla do router",
    "expansão ornamental da superfície"
  ];
  let recommendation =
    "Construir a menor unidade útil, validá-la e só depois alargar a superfície.";

  if (context.latestReport?.status && context.latestReport.status !== "pass") {
    validationPath.unshift(`rever o último report em estado ${context.latestReport.status}`);
  }

  if (routed.intent === "build_pipeline" || routed.intent === "software_project") {
    smallestBuildableUnit =
      "um patch candidate ou módulo estreito que resolva um gargalo real sem generalização prematura";
  }

  return {
    id: `${Date.now()}-${safeFileName(message)}`,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    buildQuestion,
    smallestBuildableUnit,
    validationPath,
    implementationBoundary,
    notNow,
    recommendation
  };
}

export function buildHephaestusReview(message: string, routed?: RoutedIntent): HephaestusReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatHephaestusReview(review: HephaestusReview): string {
  return [
    "HEPHAESTUS",
    "",
    `Questão de build: ${review.buildQuestion}`,
    `Menor unidade útil: ${review.smallestBuildableUnit}`,
    "",
    "Validação:",
    ...review.validationPath.map((item) => `- ${item}`),
    "",
    `Fronteira de implementação: ${review.implementationBoundary}`,
    "",
    "Não fazer já:",
    ...review.notNow.map((item) => `- ${item}`),
    "",
    `Recomendação: ${review.recommendation}`
  ].join("\n");
}

function saveReview(review: HephaestusReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "hephaestus");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();
  if (!message) {
    throw new Error('Usage: hephaestusExecutionReview.ts "peça, build ou frente técnica a enquadrar"');
  }
  const review = buildHephaestusReview(message);
  const savedPath = saveReview(review);
  console.log(formatHephaestusReview(review));
  console.log("");
  console.log(`Hephaestus review saved: ${savedPath}`);
}

main();
