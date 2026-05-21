import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";
import { readOperationalContext } from "../chat/zeusOperationalContext";

const root = process.cwd();

export type AthenaReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  strategicQuestion: string;
  criteria: string[];
  optionsFrame: string[];
  tradeoff: string;
  sequence: string[];
  notNow: string[];
  recommendation: string;
  evidence: string[];
};

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function deriveEvidence(routed: RoutedIntent, gitStatus: string, latestReportStatus: string): string[] {
  const evidence: string[] = [
    `Intent detetado: ${routed.intent}`,
    `Confiança do router: ${routed.confidence}`
  ];

  if (gitStatus !== "clean") {
    evidence.push("Há alterações locais, o que favorece consolidação antes de expansão.");
  }

  if (latestReportStatus && latestReportStatus !== "unknown") {
    evidence.push(`Último report conhecido: ${latestReportStatus}.`);
  }

  return evidence;
}

function createReview(message: string, routed: RoutedIntent): AthenaReview {
  const context = readOperationalContext();
  const latestReportStatus = context.latestReport?.status || "unknown";
  const evidence = deriveEvidence(routed, context.gitStatus, latestReportStatus);
  const id = `${Date.now()}-${safeFileName(message)}`;

  let strategicQuestion =
    "Qual é a melhor forma de avançar sem perder foco, margem de aprendizagem e controlo?";
  let criteria = [
    "valor operacional em curto prazo",
    "reversibilidade da decisão",
    "esforço total vs. feedback real"
  ];
  let optionsFrame = [
    "consolidar o que já existe",
    "abrir nova frente limitada",
    "adiar o resto até existir critério melhor"
  ];
  let tradeoff =
    "Mais ambição agora aumenta superfície, mas nem sempre aumenta prova real de progresso.";
  let sequence = [
    "fechar a frente atual",
    "validar com teste real",
    "só depois abrir a próxima peça"
  ];
  let notNow = [
    "novas abstrações amplas",
    "mais superfície visual sem motor",
    "frentes paralelas sem critério"
  ];
  let recommendation =
    "Escolher a próxima ação pela combinação de utilidade imediata, baixo risco e facilidade de validação.";

  switch (routed.intent) {
    case "strategic_deliberation":
      strategicQuestion =
        "Qual é a sequência que gera prova operacional mais cedo sem desorganizar o ZEUS?";
      criteria = [
        "prova operacional em 24-48h",
        "baixo custo de reversão",
        "menor risco de dispersão",
        "impacto no uso real do ZEUS"
      ];
      optionsFrame = [
        "continuar só no motor interno",
        "abrir uma frente grande de UI",
        "criar uma via mínima que exponha valor real sem espetáculo"
      ];
      tradeoff =
        "A engenharia pura protege robustez, mas pode atrasar feedback; a UI ampla cria sensação de produto, mas pode esconder um motor ainda incompleto.";
      sequence = [
        "fechar uma capacidade utilizável e visível",
        "testar com um fluxo real do Miguel",
        "só depois ampliar interface ou arquitetura"
      ];
      notNow = [
        "UI pesada",
        "múltiplos módulos novos ao mesmo tempo",
        "reestruturações grandes por intuição"
      ];
      recommendation =
        "Escolher a terceira via: uma peça mínima que aumente uso real do ZEUS sem abrir uma frente grande.";
      break;

    case "website_project":
      strategicQuestion =
        "O problema real é construir um site ou clarificar oferta, público e tese comercial?";
      criteria = [
        "clareza de posicionamento",
        "clareza da oferta",
        "probabilidade de conversão",
        "custo de iteração"
      ];
      optionsFrame = [
        "definir primeiro objetivo e público",
        "prototipar mensagem antes de design",
        "executar site só depois da tese fechar"
      ];
      tradeoff =
        "Quanto mais cedo se construir, mais rápido se vê algo; quanto mais cedo se clarificar, menos provável é construir a coisa errada.";
      sequence = [
        "fechar objetivo",
        "fechar público",
        "fechar mensagem principal",
        "só depois mexer em estrutura visual"
      ];
      notNow = [
        "páginas adicionais",
        "sistema visual completo",
        "copy longa antes da proposta central"
      ];
      recommendation =
        "Primeiro posicionamento e conversão; execução visual apenas quando a tese comercial estiver nítida.";
      break;

    case "marketing_plan":
      strategicQuestion =
        "Que mensagem merece repetição antes de investir em volume de conteúdo?";
      criteria = [
        "clareza da promessa",
        "alinhamento com o público certo",
        "capacidade de gerar resposta"
      ];
      optionsFrame = [
        "fixar uma tese central",
        "testar poucas mensagens fortes",
        "só depois calendarizar produção"
      ];
      tradeoff =
        "Mais conteúdo aumenta presença, mas sem tese comercial forte apenas amplifica ruído.";
      sequence = [
        "fechar promessa central",
        "testar linguagem e objeções",
        "calendarizar só o que já mostrou tração"
      ];
      notNow = [
        "calendário editorial completo",
        "campanhas largas",
        "produção contínua sem métrica"
      ];
      recommendation =
        "Trabalhar primeiro a mensagem certa, só depois a cadência.";
      break;

    case "software_project":
    case "automation_project":
    case "build_pipeline":
      strategicQuestion =
        "Qual é a menor capacidade que, se fechada agora, aumenta fiabilidade e utilidade do sistema?";
      criteria = [
        "redução de fragilidade",
        "validabilidade ponta a ponta",
        "reutilização futura",
        "baixo risco de overengineering"
      ];
      optionsFrame = [
        "fechar fluxo crítico",
        "adiar abstrações amplas",
        "expandir só depois do teste real"
      ];
      tradeoff =
        "Mais arquitetura aumenta potencial de reutilização, mas também aumenta a superfície de falha antes do valor estar provado.";
      sequence = [
        "corrigir o fluxo mínimo",
        "validar com uso real",
        "só depois extrair abstrações"
      ];
      notNow = [
        "novas dependências desnecessárias",
        "frameworkização precoce",
        "expansão de capabilities sem necessidade"
      ];
      recommendation =
        "Fechar primeiro a peça mínima de maior valor operacional e só depois generalizar.";
      break;

    case "finance_analysis":
      strategicQuestion =
        "Que decisão protege melhor caixa, tempo e opcionalidade?";
      criteria = [
        "risco de caixa",
        "retorno provável",
        "opcionalidade futura",
        "tempo até prova"
      ];
      optionsFrame = [
        "proteger liquidez",
        "adiar decisões pouco reversíveis",
        "testar pequeno antes de comprometer grande"
      ];
      tradeoff =
        "Mais compromisso pode acelerar retorno, mas reduz margem para corrigir direção sem custo.";
      sequence = [
        "proteger downside",
        "validar cenário",
        "só depois aumentar exposição"
      ];
      notNow = [
        "compromissos rígidos",
        "alocação grande sem cenário",
        "decisões irreversíveis cedo demais"
      ];
      recommendation =
        "Escolher a opção que preserva caixa e opcionalidade até existir prova melhor.";
      break;
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    strategicQuestion,
    criteria,
    optionsFrame,
    tradeoff,
    sequence,
    notNow,
    recommendation,
    evidence
  };
}

export function buildAthenaReview(message: string, routed?: RoutedIntent): AthenaReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatAthenaReview(review: AthenaReview): string {
  return [
    "ATHENA",
    "",
    `Questão estratégica: ${review.strategicQuestion}`,
    "",
    "Critérios:",
    ...review.criteria.map((item) => `- ${item}`),
    "",
    "Enquadramento das opções:",
    ...review.optionsFrame.map((item) => `- ${item}`),
    "",
    `Trade-off central: ${review.tradeoff}`,
    "",
    "Sequência recomendada:",
    ...review.sequence.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Não fazer já:",
    ...review.notNow.map((item) => `- ${item}`),
    "",
    `Recomendação: ${review.recommendation}`
  ].join("\n");
}

function saveReview(review: AthenaReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "athena");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    throw new Error('Usage: athenaStrategicReview.ts "texto ou decisão a enquadrar"');
  }

  const review = buildAthenaReview(message);
  const savedPath = saveReview(review);

  console.log(formatAthenaReview(review));
  console.log("");
  console.log(`Athena review saved: ${savedPath}`);
}

main();
