import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";

const root = process.cwd();

export type PlutusReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  economicQuestion: string;
  upside: string[];
  downside: string[];
  costDrivers: string[];
  optionality: string;
  recommendation: string;
  disclaimer: string;
};

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function createReview(message: string, routed: RoutedIntent): PlutusReview {
  const id = `${Date.now()}-${safeFileName(message)}`;

  let economicQuestion =
    "Que opção protege melhor tempo, energia e margem sem bloquear progresso futuro?";
  let upside = [
    "ganho de clareza operacional",
    "redução de retrabalho",
    "maior velocidade de decisão"
  ];
  let downside = [
    "consumo de foco",
    "abertura de frentes paralelas",
    "trabalho sem retorno imediato"
  ];
  let costDrivers = [
    "tempo de implementação",
    "custo de manutenção",
    "custo de contexto e atenção"
  ];
  let optionality =
    "A melhor opção é a que conserva mais margem para corrigir a direção sem custo excessivo.";
  let recommendation =
    "Escolher a via que produz valor verificável com menor consumo irreversível de tempo e estrutura.";
  let disclaimer =
    "Isto é raciocínio económico-operacional, não aconselhamento financeiro regulado.";

  switch (routed.intent) {
    case "finance_analysis":
      economicQuestion =
        "Que decisão preserva caixa, reduz downside e mantém opcionalidade suficiente para corrigir curso?";
      upside = [
        "proteção de liquidez",
        "capacidade de testar antes de escalar",
        "menor risco de compromisso rígido"
      ];
      downside = [
        "decisão demasiado lenta pode perder janela útil",
        "prudência excessiva pode adiar prova necessária",
        "subinvestimento pode limitar retorno"
      ];
      costDrivers = [
        "caixa comprometida",
        "tempo até retorno",
        "custo de oportunidade"
      ];
      optionality =
        "Opcionalidade vale mais quando a informação ainda é incompleta e o erro pode ser caro.";
      recommendation =
        "Favorecer passos pequenos e reversíveis até existir prova melhor sobre retorno e risco.";
      break;

    case "strategic_deliberation":
      economicQuestion =
        "Que frente gera maior valor por unidade de atenção sem aumentar demasiado o custo de complexidade?";
      upside = [
        "mais uso real do ZEUS",
        "feedback rápido",
        "consolidação de valor reutilizável"
      ];
      downside = [
        "superfície nova sem motor suficiente",
        "gasto de energia em UI ou arquitetura pouco validada",
        "dívida de manutenção"
      ];
      costDrivers = [
        "tempo até prova operacional",
        "custo de contexto",
        "manutenção da frente aberta"
      ];
      optionality =
        "A melhor frente é a que aumenta utilidade já, sem comprometer demasiado a direção futura.";
      recommendation =
        "Escolher a peça com melhor relação entre prova rápida, baixo retrabalho e utilidade real.";
      break;

    case "website_project":
    case "marketing_plan":
      economicQuestion =
        "Que mensagem ou ativo melhora conversão sem exigir já uma produção extensa?";
      upside = [
        "clareza comercial",
        "maior taxa de resposta",
        "menos desperdício em produção errada"
      ];
      downside = [
        "gastar em design ou conteúdo antes da tese fechar",
        "tempo em materiais pouco convertíveis",
        "sinal fraco para o mercado"
      ];
      costDrivers = [
        "tempo de produção",
        "custo de iteração",
        "custo de oportunidade comercial"
      ];
      optionality =
        "Mensagens e estruturas leves conservam mais margem para ajustar sem custo elevado.";
      recommendation =
        "Investir primeiro em clareza de proposta e prova, só depois em escala visual ou editorial.";
      break;

    case "software_project":
    case "automation_project":
    case "build_pipeline":
      economicQuestion =
        "Que investimento técnico reduz mais retrabalho por unidade de esforço agora?";
      upside = [
        "menos falhas repetidas",
        "maior previsibilidade",
        "maior reutilização futura"
      ];
      downside = [
        "overengineering dispendioso",
        "custo de manutenção de abstrações precoces",
        "bloqueio em melhorias invisíveis"
      ];
      costDrivers = [
        "tempo de engenharia",
        "tempo de validação",
        "custo de manutenção do novo módulo"
      ];
      optionality =
        "Correcções mínimas e auditáveis conservam melhor opcionalidade do que reescritas amplas.";
      recommendation =
        "Favorecer a intervenção mínima de maior retorno operacional e adiar generalizações caras.";
      break;
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    economicQuestion,
    upside,
    downside,
    costDrivers,
    optionality,
    recommendation,
    disclaimer
  };
}

export function buildPlutusReview(message: string, routed?: RoutedIntent): PlutusReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatPlutusReview(review: PlutusReview): string {
  return [
    "PLUTUS",
    "",
    `Questão económica: ${review.economicQuestion}`,
    "",
    "Upside:",
    ...review.upside.map((item) => `- ${item}`),
    "",
    "Downside:",
    ...review.downside.map((item) => `- ${item}`),
    "",
    "Drivers de custo:",
    ...review.costDrivers.map((item) => `- ${item}`),
    "",
    `Opcionalidade: ${review.optionality}`,
    `Recomendação: ${review.recommendation}`,
    "",
    `Reserva: ${review.disclaimer}`
  ].join("\n");
}

function saveReview(review: PlutusReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "plutus");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    throw new Error('Usage: plutusEconomicReview.ts "decisão ou frente a analisar"');
  }

  const review = buildPlutusReview(message);
  const savedPath = saveReview(review);

  console.log(formatPlutusReview(review));
  console.log("");
  console.log(`Plutus review saved: ${savedPath}`);
}

main();
