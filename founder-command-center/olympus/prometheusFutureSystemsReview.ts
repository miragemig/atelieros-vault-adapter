import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";

const root = process.cwd();

export type PrometheusReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  researchQuestion: string;
  opportunityArea: string;
  boundedExperiments: string[];
  enablingConditions: string[];
  redFlags: string[];
  notNow: string[];
  recommendation: string;
};

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function createReview(message: string, routed: RoutedIntent): PrometheusReview {
  const id = `${Date.now()}-${safeFileName(message)}`;

  let researchQuestion =
    "Que possibilidade futura vale a pena explorar sem abrir já uma frente pesada ou irreversível?";
  let opportunityArea =
    "Capacidades futuras que podem aumentar utilidade real do ZEUS se forem testadas em modo estreito.";
  let boundedExperiments = [
    "desenhar um microprotótipo reversível",
    "comparar duas abordagens com critérios explícitos",
    "validar com um uso real antes de generalizar"
  ];
  let enablingConditions = [
    "objetivo operacional claro",
    "limite de tempo curto",
    "guardrails definidos por Themis",
    "critérios de paragem e de sucesso"
  ];
  let redFlags = [
    "abrir investigação sem pergunta concreta",
    "transformar curiosidade em nova frente permanente",
    "confundir exploração com compromisso de implementação"
  ];
  let notNow = [
    "reestruturar módulos estáveis sem prova",
    "ligar automações sensíveis sem gate",
    "escalar uma ideia antes de um teste pequeno"
  ];
  let recommendation =
    "Explorar só o próximo experimento pequeno que possa produzir aprendizagem útil sem espalhar o foco do ZEUS.";

  switch (routed.intent) {
    case "knowledge_request":
      researchQuestion =
        "Que linha de estudo oferece aprendizagem aplicável ao ZEUS sem se perder em investigação aberta?";
      opportunityArea =
        "Métodos, padrões e sistemas que possam ser traduzidos em capacidades auditáveis e locais.";
      boundedExperiments = [
        "resumir três padrões úteis e compará-los",
        "propor um teste local de baixa fricção",
        "ligar cada hipótese a uma dor operacional concreta"
      ];
      enablingConditions = [
        "fontes suficientemente fiáveis",
        "critério de utilidade prática",
        "ligação explícita ao objetivo do Miguel"
      ];
      redFlags = [
        "estudar por acumulação sem síntese",
        "importar ideias sem adaptação ao ZEUS",
        "misturar inspiração com prova"
      ];
      notNow = [
        "grandes refatores motivados só por novidade",
        "novas dependências sem retorno claro",
        "pesquisa sem output verificável"
      ];
      recommendation =
        "Conduzir investigação curta, com output comparativo e uma hipótese pequena pronta a validar.";
      break;

    case "strategic_deliberation":
      researchQuestion =
        "Que hipótese futura merece ser testada para reduzir incerteza estratégica sem travar a execução atual?";
      opportunityArea =
        "Futuros módulos ou padrões que possam aumentar leverage do ZEUS depois de provados em escala mínima.";
      boundedExperiments = [
        "testar uma versão v0.1 estreita",
        "comparar benefício esperado com custo de manutenção",
        "medir se a hipótese reduz carga mental real"
      ];
      enablingConditions = [
        "janela curta de exploração",
        "uma métrica simples de utilidade",
        "sem interromper o fluxo Hermes/Themis/Hephaestus"
      ];
      redFlags = [
        "usar investigação para adiar decisão",
        "abrir uma nova frente enquanto a base ainda precisa de consolidação",
        "confundir visão futura com prioridade atual"
      ];
      notNow = [
        "expansão ampla de browser control",
        "automação total de envio",
        "frameworks novos sem prova operacional"
      ];
      recommendation =
        "Testar só a hipótese futura que mais reduz incerteza e mais preserva foco na execução principal.";
      break;

    case "software_project":
    case "automation_project":
    case "build_pipeline":
      researchQuestion =
        "Que inovação técnica vale ser explorada porque pode reduzir fragilidade ou esforço repetido mais à frente?";
      opportunityArea =
        "Padrões de runtime, validação ou tooling que possam aumentar robustez sem obrigar já a reescrita.";
      boundedExperiments = [
        "prova de conceito isolada",
        "teste comparativo em módulo periférico",
        "avaliação de impacto antes de tocar no core"
      ];
      enablingConditions = [
        "write scope contido",
        "capacidade de rollback simples",
        "benefício potencial superior ao custo de integração"
      ];
      redFlags = [
        "mudar arquitetura só porque parece elegante",
        "acoplar o core a tecnologia ainda não validada",
        "introduzir complexidade prematura"
      ];
      notNow = [
        "reescrever o router central",
        "migrar tudo para nova stack",
        "abrir camada experimental no core"
      ];
      recommendation =
        "Preferir prova de conceito periférica e reversível antes de qualquer integração estrutural.";
      break;
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    researchQuestion,
    opportunityArea,
    boundedExperiments,
    enablingConditions,
    redFlags,
    notNow,
    recommendation
  };
}

export function buildPrometheusReview(
  message: string,
  routed?: RoutedIntent
): PrometheusReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatPrometheusReview(review: PrometheusReview): string {
  return [
    "PROMETHEUS",
    "",
    `Questão de investigação: ${review.researchQuestion}`,
    `Área de oportunidade: ${review.opportunityArea}`,
    "",
    "Experimentos delimitados:",
    ...review.boundedExperiments.map((item) => `- ${item}`),
    "",
    "Condições de entrada:",
    ...review.enablingConditions.map((item) => `- ${item}`),
    "",
    "Red flags:",
    ...review.redFlags.map((item) => `- ${item}`),
    "",
    "Não fazer já:",
    ...review.notNow.map((item) => `- ${item}`),
    "",
    `Recomendação: ${review.recommendation}`
  ].join("\n");
}

function saveReview(review: PrometheusReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "prometheus");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    throw new Error(
      'Usage: prometheusFutureSystemsReview.ts "hipótese, frente ou sistema a explorar"'
    );
  }

  const review = buildPrometheusReview(message);
  const savedPath = saveReview(review);

  console.log(formatPrometheusReview(review));
  console.log("");
  console.log(`Prometheus review saved: ${savedPath}`);
}

main();
