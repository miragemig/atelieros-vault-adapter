import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";

const root = process.cwd();

export type PoseidonReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  surfaceQuestion: string;
  unstableSurfaces: string[];
  permissionsBoundary: string;
  safeHandling: string;
  doNotDoNow: string[];
};

function safeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

function createReview(message: string, routed: RoutedIntent): PoseidonReview {
  let surfaceQuestion =
    "Que superfícies externas ou instáveis estão envolvidas e como evitar perder controlo sobre elas?";
  let unstableSurfaces = [
    "browser e sessões autenticadas",
    "serviços externos com estado próprio",
    "fluxos que podem mudar fora do controlo do ZEUS"
  ];
  let permissionsBoundary =
    "Tudo o que toca browser, rede, contas ou sistemas externos deve ser tratado como approval-gated.";
  let safeHandling =
    "Preparar primeiro o passo e só depois tocar a superfície externa com autorização explícita.";
  let doNotDoNow = [
    "abrir automação agressiva sobre browser",
    "presumir estabilidade de UI externa",
    "executar ações irreversíveis em serviços externos"
  ];

  if (routed.intent === "website_project" || routed.intent === "marketing_plan") {
    unstableSurfaces = [
      "website e experiência externa visível",
      "canais públicos ou semipúblicos",
      "browser e publicação"
    ];
  }

  if (routed.intent === "security_review" || routed.intent === "automation_project") {
    safeHandling =
      "Mapear primeiro as fronteiras de permissão e limitar a automação ao menor gesto reversível.";
  }

  return {
    id: `${Date.now()}-${safeFileName(message)}`,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    surfaceQuestion,
    unstableSurfaces,
    permissionsBoundary,
    safeHandling,
    doNotDoNow
  };
}

export function buildPoseidonReview(message: string, routed?: RoutedIntent): PoseidonReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatPoseidonReview(review: PoseidonReview): string {
  return [
    "POSEIDON",
    "",
    `Questão de superfície: ${review.surfaceQuestion}`,
    "",
    "Superfícies instáveis:",
    ...review.unstableSurfaces.map((item) => `- ${item}`),
    "",
    `Fronteira de permissão: ${review.permissionsBoundary}`,
    `Tratamento seguro: ${review.safeHandling}`,
    "",
    "Não fazer já:",
    ...review.doNotDoNow.map((item) => `- ${item}`)
  ].join("\n");
}

function saveReview(review: PoseidonReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "poseidon");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();
  if (!message) {
    throw new Error('Usage: poseidonExternalSurfaceReview.ts "frente ou ação externa a enquadrar"');
  }
  const review = buildPoseidonReview(message);
  const savedPath = saveReview(review);
  console.log(formatPoseidonReview(review));
  console.log("");
  console.log(`Poseidon review saved: ${savedPath}`);
}

main();
