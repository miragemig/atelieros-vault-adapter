import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";

const root = process.cwd();

export type DaedalusReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  designQuestion: string;
  userSurface: string[];
  systemBlocks: string[];
  primaryFlow: string[];
  constraints: string[];
  prototypeAdvice: string;
};

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function createReview(message: string, routed: RoutedIntent): DaedalusReview {
  const id = `${Date.now()}-${safeFileName(message)}`;

  let designQuestion =
    "Qual é a menor estrutura de sistema que torna o fluxo mais utilizável sem aumentar demasiado a complexidade?";
  let userSurface = [
    "um ponto de entrada simples",
    "um estado visível",
    "um comando ou ação principal"
  ];
  let systemBlocks = [
    "router",
    "estado operacional",
    "saída verificável"
  ];
  let primaryFlow = [
    "receber pedido",
    "interpretar",
    "mostrar próxima ação segura"
  ];
  let constraints = [
    "não abrir mais superfícies do que o motor consegue suportar",
    "não separar UX da realidade operacional",
    "não criar fachada sem utilidade"
  ];
  let prototypeAdvice =
    "Desenhar só a menor superfície que torne o fluxo utilizável e compreensível.";

  switch (routed.intent) {
    case "strategic_deliberation":
      designQuestion =
        "Que superfície mínima permite ao Miguel sentir o ZEUS vivo sem exigir uma UI pesada?";
      userSurface = [
        "console mínima",
        "estado atual do sistema",
        "bloco de decisão e próxima ação"
      ];
      systemBlocks = [
        "router ZEUS",
        "estado operacional",
        "pareceres de Olympus",
        "gates visíveis"
      ];
      primaryFlow = [
        "Miguel escreve ou fala",
        "ZEUS interpreta",
        "Olympus informa",
        "ZEUS recomenda",
        "Miguel aprova ou recusa"
      ];
      constraints = [
        "não construir interface completa antes do fluxo principal estar sólido",
        "não adicionar navegação ou painéis sem utilidade operacional",
        "não esconder gates nem estados"
      ];
      prototypeAdvice =
        "Prototipar uma command chamber mínima com estado, decisão e ações seguras visíveis.";
      break;

    case "website_project":
      designQuestion =
        "Que arquitetura de página suporta melhor clareza de oferta e conversão antes de expandir conteúdo?";
      userSurface = [
        "headline clara",
        "prova ou caso",
        "ação principal"
      ];
      systemBlocks = [
        "mensagem central",
        "prova",
        "estrutura curta de decisão"
      ];
      primaryFlow = [
        "visitante percebe a oferta",
        "valida credibilidade",
        "avança para contacto ou próximo passo"
      ];
      constraints = [
        "não inflacionar secções sem tese comercial",
        "não tratar o site como catálogo genérico",
        "não esconder a proposta principal"
      ];
      prototypeAdvice =
        "Desenhar primeiro a sequência de conversão, não a ornamentação da página.";
      break;

    case "software_project":
    case "automation_project":
    case "build_pipeline":
      designQuestion =
        "Que separação de módulos mantém o sistema legível sem fragmentar o fluxo crítico?";
      userSurface = [
        "um comando claro por capacidade",
        "logs e estado acessíveis",
        "saída auditável"
      ];
      systemBlocks = [
        "módulo de decisão",
        "módulo de execução controlada",
        "módulo de memória",
        "módulo de revisão"
      ];
      primaryFlow = [
        "pedido entra",
        "capacidade certa é escolhida",
        "saída é preparada",
        "gates são respeitados",
        "resultado fica auditável"
      ];
      constraints = [
        "não multiplicar módulos sem distinção clara de função",
        "não esconder dependências entre router, runtime e reports",
        "não transformar abstração em fim"
      ];
      prototypeAdvice =
        "Separar módulos por responsabilidade real e manter um fluxo principal testável ponta a ponta.";
      break;
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    designQuestion,
    userSurface,
    systemBlocks,
    primaryFlow,
    constraints,
    prototypeAdvice
  };
}

export function buildDaedalusReview(message: string, routed?: RoutedIntent): DaedalusReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatDaedalusReview(review: DaedalusReview): string {
  return [
    "DAEDALUS",
    "",
    `Questão de sistema: ${review.designQuestion}`,
    "",
    "Superfície para o utilizador:",
    ...review.userSurface.map((item) => `- ${item}`),
    "",
    "Blocos do sistema:",
    ...review.systemBlocks.map((item) => `- ${item}`),
    "",
    "Fluxo principal:",
    ...review.primaryFlow.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Restrições:",
    ...review.constraints.map((item) => `- ${item}`),
    "",
    `Conselho de protótipo: ${review.prototypeAdvice}`
  ].join("\n");
}

function saveReview(review: DaedalusReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "daedalus");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    throw new Error('Usage: daedalusSystemDesign.ts "texto ou sistema a estruturar"');
  }

  const review = buildDaedalusReview(message);
  const savedPath = saveReview(review);

  console.log(formatDaedalusReview(review));
  console.log("");
  console.log(`Daedalus review saved: ${savedPath}`);
}

main();
