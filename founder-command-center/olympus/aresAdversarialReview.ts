import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";
import { readOperationalContext } from "../chat/zeusOperationalContext";

const root = process.cwd();

export type AresReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  severity: "low" | "medium" | "high";
  primaryWarning: string;
  risks: string[];
  blockedAssumptions: string[];
  pressureTest: string;
  safeNextStep: string;
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
    evidence.push("Git com alterações locais por consolidar.");
  }

  if (latestReportStatus && latestReportStatus !== "unknown" && latestReportStatus !== "pass") {
    evidence.push(`Último report em estado não verde: ${latestReportStatus}.`);
  }

  return evidence;
}

function createReview(message: string, routed: RoutedIntent): AresReview {
  const context = readOperationalContext();
  const latestReportStatus = context.latestReport?.status || "unknown";
  const evidence = deriveEvidence(routed, context.gitStatus, latestReportStatus);
  const id = `${Date.now()}-${safeFileName(message)}`;

  let severity: AresReview["severity"] = "medium";
  let primaryWarning = "O principal risco é avançar sem clarificar a hipótese errada.";
  let risks = [
    "Misturar análise com execução tende a degradar disciplina operacional.",
    "Criar nova frente antes de fechar a anterior aumenta dispersão.",
    "A ausência de critério explícito mascara más decisões como impulso."
  ];
  let blockedAssumptions = [
    "Que mais atividade significa mais progresso.",
    "Que o primeiro caminho intuitivo é o mais rentável.",
    "Que a pressão do momento substitui priorização."
  ];
  let pressureTest =
    "Se esta decisão falhar em 7 dias, qual foi a premissa que nunca chegou a ser validada?";
  let safeNextStep =
    "Escolher uma única ação reversível, com output verificável, antes de abrir nova frente.";

  switch (routed.intent) {
    case "strategic_deliberation":
      severity = "high";
      primaryWarning =
        "O risco principal é cair numa falsa escolha entre duas frentes e abrir uma terceira sem motor suficiente.";
      risks = [
        "Escolher UI cedo demais pode produzir fachada sem robustez interna.",
        "Continuar apenas na engenharia invisível pode reduzir feedback real e desmotivar o uso.",
        "Tentar fazer as duas coisas em paralelo tende a fragmentar foco e qualidade."
      ];
      blockedAssumptions = [
        "Que tens de escolher apenas entre build system e UI.",
        "Que visibilidade imediata equivale a progresso estrutural.",
        "Que mais arquitetura resolve indecisão estratégica."
      ];
      pressureTest =
        "Se fosses obrigado a demonstrar valor real amanhã, qual destas opções produz prova operacional em vez de aparência?";
      safeNextStep =
        "Criar uma terceira via mínima e testável: mais interação real sem abrir uma frente grande de produto.";
      break;

    case "website_project":
      severity = "high";
      primaryWarning =
        "O risco principal é produzir design ou código antes de existir objetivo comercial e critério de conversão.";
      risks = [
        "Construir antes de definir público e oferta gera desperdício.",
        "Misturar identidade, produto e mensagem na mesma iteração cria ruído estratégico.",
        "Uma solução bonita pode esconder ausência de tese comercial."
      ];
      blockedAssumptions = [
        "Que o problema já é de execução visual.",
        "Que mais páginas significam mais clareza.",
        "Que o site deve nascer antes do posicionamento."
      ];
      pressureTest =
        "Qual é a frase comercial que o site teria de provar na primeira dobra para justificar existir?";
      safeNextStep =
        "Fechar objetivo, público e resultado esperado antes de qualquer execução de design ou código.";
      break;

    case "marketing_plan":
      severity = "high";
      primaryWarning =
        "O risco principal é produzir volume de conteúdo sem posição clara nem métrica de tração.";
      risks = [
        "Conteúdo sem tese comercial cria esforço sem retorno.",
        "Campanhas cedo demais cristalizam uma mensagem ainda fraca.",
        "Produção contínua sem filtro degrada a marca."
      ];
      blockedAssumptions = [
        "Que consistência compensa posicionamento difuso.",
        "Que publicar mais corrige falta de clareza.",
        "Que comunicação substitui proposta de valor."
      ];
      pressureTest =
        "Se tivesses de cortar 80% do plano, que mensagem única sobreviveria por ainda gerar procura?";
      safeNextStep =
        "Definir promessa central, público exato e critério de resposta antes do calendário.";
      break;

    case "build_pipeline":
    case "software_project":
    case "automation_project":
      severity = "high";
      primaryWarning =
        "O risco principal é cair em overengineering e aumentar superfície antes de validar o fluxo essencial.";
      risks = [
        "Acrescentar módulos novos pode ocultar bugs do fluxo principal.",
        "Dependências e automações cedo demais aumentam fragilidade operacional.",
        "Pipelines genéricos tendem a falhar quando o problema pede uma correção cirúrgica."
      ];
      blockedAssumptions = [
        "Que mais abstração traz mais controlo.",
        "Que o problema é de arquitetura e não de fluxo.",
        "Que expandir capabilities agora reduz risco."
      ];
      pressureTest =
        "Qual é a menor mudança verificável que resolve o problema sem introduzir uma nova classe de falha?";
      safeNextStep =
        "Fechar o caso mínimo e validá-lo ponta a ponta antes de expandir superfície técnica.";
      break;

    case "security_review":
      severity = "high";
      primaryWarning =
        "O risco principal é subestimar efeitos laterais e confiar em controlos implícitos.";
      risks = [
        "Controlos informais não substituem gates explícitos.",
        "Um caminho conveniente pode violar fronteiras de aprovação.",
        "Automação com acesso local ou externo deve ser tratada como ação sensível."
      ];
      blockedAssumptions = [
        "Que a intenção correta elimina o risco operacional.",
        "Que o operador se lembrará sempre do gate manualmente.",
        "Que o ambiente atual é equivalente ao ambiente real."
      ];
      pressureTest =
        "Que ação indevida seria possível hoje se alguém usasse o caminho mais fácil em vez do mais seguro?";
      safeNextStep =
        "Listar superfícies críticas e confirmar para cada uma: permitido, bloqueado ou approval-gated.";
      break;
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    severity,
    primaryWarning,
    risks,
    blockedAssumptions,
    pressureTest,
    safeNextStep,
    evidence
  };
}

export function buildAresReview(message: string, routed?: RoutedIntent): AresReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatAresReview(review: AresReview): string {
  return [
    "ARES",
    "",
    `Severidade: ${review.severity}`,
    `Sinal principal: ${review.primaryWarning}`,
    "",
    "Riscos:",
    ...review.risks.map((risk) => `- ${risk}`),
    "",
    "Pressupostos a bloquear:",
    ...review.blockedAssumptions.map((item) => `- ${item}`),
    "",
    `Pressure test: ${review.pressureTest}`,
    `Próxima ação segura: ${review.safeNextStep}`
  ].join("\n");
}

function saveReview(review: AresReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "ares");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    throw new Error('Usage: aresAdversarialReview.ts "texto ou decisão a rever"');
  }

  const review = buildAresReview(message);
  const savedPath = saveReview(review);

  console.log(formatAresReview(review));
  console.log("");
  console.log(`Ares review saved: ${savedPath}`);
}

main();
