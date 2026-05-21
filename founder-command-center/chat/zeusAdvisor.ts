import { buildAresReview } from "../olympus/aresAdversarialReview";
import { buildArgusReview } from "../olympus/argusExternalWatch";
import { buildApolloReview } from "../olympus/apolloNarrativeReview";
import { buildAthenaReview } from "../olympus/athenaStrategicReview";
import { buildDaedalusReview } from "../olympus/daedalusSystemDesign";
import { buildHarmoniaReview } from "../olympus/harmoniaFinalReview";
import { buildMnemosyneReview } from "../olympus/mnemosyneOperationalMemory";
import { buildPlutusReview } from "../olympus/plutusEconomicReview";
import { buildPrometheusReview } from "../olympus/prometheusFutureSystemsReview";
import { buildThemisReview } from "../olympus/themisGovernanceReview";
import { mapInternalToClassicalOlympus } from "../olympus/classicalOlympusAdapters";
import { RoutedIntent } from "./zeusIntentRouter";
import { readOperationalContext } from "./zeusOperationalContext";

function inferMatters(intent: string): string[] {
  if (intent === "strategic_deliberation") {
    return [
      "priorização estratégica",
      "maturidade técnica",
      "risco de dispersão",
      "valor de feedback imediato",
      "controlo operacional"
    ];
  }

  if (intent === "website_project") {
    return [
      "posicionamento",
      "comunicação",
      "conversão",
      "UX",
      "risco de execução prematura"
    ];
  }

  if (intent === "marketing_plan") {
    return [
      "posicionamento",
      "público-alvo",
      "proposta de valor",
      "canais",
      "métricas"
    ];
  }

  if (intent === "build_pipeline") {
    return [
      "engenharia",
      "validação",
      "testes funcionais",
      "governança",
      "risco técnico"
    ];
  }

  return [
    "interpretação do pedido",
    "risco",
    "prioridade",
    "próxima ação segura"
  ];
}

function optionsFor(intent: string, message: string): string[] {
  if (intent === "strategic_deliberation") {
    return [
      "Continuar a endurecer o build system: aumenta robustez, mas mantém o ZEUS menos visível/interativo.",
      "Avançar para uma UI completa: dá sensação de produto, mas abre uma frente grande e pode virar fachada.",
      "Criar uma ZEUS Console v0.1 mínima: dá interação imediata sem abandonar a disciplina técnica."
    ];
  }

  if (intent === "website_project") {
    return [
      "Não criar projeto nem ficheiros: apenas clarificar objetivo e posicionamento.",
      "Criar uma deliberação escrita em proposals: útil para rever sem comprometer estrutura.",
      "Adiar qualquer execução até existir brief mínimo aprovado."
    ];
  }

  if (intent === "marketing_plan") {
    return [
      "Definir primeiro público e promessa central.",
      "Criar apenas um plano em draft, sem calendário operacional ainda.",
      "Recolher referências e objeções antes de produzir conteúdo."
    ];
  }

  return [
    "Responder apenas com análise.",
    "Pedir informação em falta.",
    "Propor próxima ação segura sem execução."
  ];
}

function risksFor(intent: string, gitStatus: string): string[] {
  const risks: string[] = [];

  if (gitStatus !== "clean") {
    risks.push("O Git não está limpo. Qualquer execução persistente deve ficar bloqueada.");
  }

  if (intent === "strategic_deliberation") {
    risks.push("Escolher UI completa cedo demais pode criar uma superfície bonita sem motor suficientemente sólido.");
    risks.push("Continuar só no build system pode manter o ZEUS invisível e reduzir feedback emocional/operacional.");
    risks.push("Abrir demasiadas frentes ao mesmo tempo degrada foco e aumenta dívida técnica.");
  }

  if (intent === "website_project") {
    risks.push("Executar design ou código antes de definir objetivo, público e conversão é desperdício.");
    risks.push("Misturar marcas/produtos/visões numa só frente cria ruído estratégico.");
  }

  if (intent === "marketing_plan") {
    risks.push("Produzir conteúdo sem posicionamento cria volume, não tração.");
  }

  if (risks.length === 0) {
    risks.push("Risco baixo nesta fase, desde que nenhuma ação persistente seja executada.");
  }

  return risks;
}

function preliminaryJudgement(intent: string): string {
  if (intent === "strategic_deliberation") {
    return [
      "Não recomendo escolher entre build system e UI como se fossem caminhos exclusivos.",
      "A decisão correta é uma terceira via: criar uma ZEUS Console v0.1 mínima, ligada ao estado real, sem abrir uma frente pesada de frontend.",
      "Isso dá interação ao Miguel e mantém a disciplina do sistema."
    ].join(" ");
  }

  if (intent === "website_project") {
    return "Não se deve criar projeto, design ou código nesta fase. A ação correta é clarificar posicionamento e objetivo em modo deliberativo.";
  }

  if (intent === "marketing_plan") {
    return "Não se deve produzir calendário de conteúdos ainda. Primeiro é obrigatório fixar público, promessa e tese comercial.";
  }

  return "A resposta deve permanecer deliberativa. Sem execução persistente nesta fase.";
}

function recommendedNextStep(intent: string): string {
  if (intent === "strategic_deliberation") {
    return "Criar ZEUS Console v0.1 mínima: terminal/browser simples, estado real, chat com ZEUS, sem execução crítica.";
  }

  if (intent === "website_project") {
    return "Responder a três perguntas: objetivo, público-alvo e resultado esperado. Sem criar ficheiros.";
  }

  if (intent === "marketing_plan") {
    return "Definir produto/serviço, público-alvo e promessa central antes de qualquer plano.";
  }

  return "Manter deliberação, pedir informação em falta e evitar execução.";
}

export function createZeusResponse(message: string, routed: RoutedIntent): string {
  const visibleOlympus = mapInternalToClassicalOlympus(routed.internalOlympusAgentIds);
  const context = readOperationalContext();
  const plutusReview = routed.internalOlympusAgentIds.includes("plutus")
    ? buildPlutusReview(message, routed)
    : null;
  const prometheusReview = routed.internalOlympusAgentIds.includes("prometheus")
    ? buildPrometheusReview(message, routed)
    : null;
  const themisReview = routed.internalOlympusAgentIds.includes("themis")
    ? buildThemisReview(message, routed)
    : null;
  const apolloReview = routed.internalOlympusAgentIds.includes("apollo")
    ? buildApolloReview(message, routed)
    : null;
  const argusReview = routed.internalOlympusAgentIds.includes("argus")
    ? buildArgusReview(message, routed)
    : null;
  const daedalusReview = routed.internalOlympusAgentIds.includes("daedalus")
    ? buildDaedalusReview(message, routed)
    : null;
  const harmoniaReview = routed.internalOlympusAgentIds.includes("harmonia")
    ? buildHarmoniaReview(message, routed)
    : null;
  const mnemosyneReview = routed.internalOlympusAgentIds.includes("mnemosyne")
    ? buildMnemosyneReview(message, routed)
    : null;
  const athenaReview = routed.internalOlympusAgentIds.includes("athena")
    ? buildAthenaReview(message, routed)
    : null;
  const aresReview = routed.internalOlympusAgentIds.includes("ares")
    ? buildAresReview(message, routed)
    : null;

  const olympus = visibleOlympus
    .map((agent) => `- ${agent.name}: ${agent.title}`)
    .join("\n");

  const matters = inferMatters(routed.intent).map((item) => `- ${item}`).join("\n");
  const options = optionsFor(routed.intent, message).map((item, index) => `${index + 1}. ${item}`).join("\n");
  const risksSource = aresReview?.risks || risksFor(routed.intent, context.gitStatus);
  const risks = risksSource.map((item) => `- ${item}`).join("\n");
  const athenaLines = athenaReview
    ? [
        "Parecer de Athena:",
        `- Questão estratégica: ${athenaReview.strategicQuestion}`,
        `- Trade-off central: ${athenaReview.tradeoff}`,
        `- Recomendação: ${athenaReview.recommendation}`,
        `- Não fazer já: ${athenaReview.notNow.join("; ")}`,
        ""
      ]
    : [];
  const daedalusLines = daedalusReview
    ? [
        "Sinal de Hephaestus:",
        `- Questão de sistema: ${daedalusReview.designQuestion}`,
        `- Superfície mínima: ${daedalusReview.userSurface[0] || "não definida"}`,
        `- Bloco crítico: ${daedalusReview.systemBlocks[0] || "não definido"}`,
        `- Conselho de protótipo: ${daedalusReview.prototypeAdvice}`,
        ""
      ]
    : [];
  const argusLines = argusReview
    ? [
        "Parecer de Artemis:",
        `- Questão de watch: ${argusReview.watchQuestion}`,
        `- Alvo inicial: ${argusReview.watchTargets[0] || "não definido"}`,
        `- Sinal principal: ${argusReview.signalTypes[0] || "não definido"}`,
        `- Guardrail chave: ${argusReview.guardrails[0] || "não definido"}`,
        ""
      ]
    : [];
  const apolloLines = apolloReview
    ? [
        "Parecer de Apollo:",
        `- Promessa central: ${apolloReview.corePromise}`,
        `- Público: ${apolloReview.audience}`,
        `- Prova principal: ${apolloReview.proofPoints[0] || "não definida"}`,
        `- Call to action: ${apolloReview.callToAction}`,
        ""
      ]
    : [];
  const plutusLines = plutusReview
    ? [
        "Parecer de Deméter:",
        `- Questão económica: ${plutusReview.economicQuestion}`,
        `- Driver principal: ${plutusReview.costDrivers[0] || "não definido"}`,
        `- Opcionalidade: ${plutusReview.optionality}`,
        `- Recomendação: ${plutusReview.recommendation}`,
        ""
      ]
    : [];
  const prometheusLines = prometheusReview
    ? [
        "Sinal de Hephaestus:",
        `- Questão de investigação: ${prometheusReview.researchQuestion}`,
        `- Área de oportunidade: ${prometheusReview.opportunityArea}`,
        `- Experimento inicial: ${prometheusReview.boundedExperiments[0] || "não definido"}`,
        `- Guardrail principal: ${prometheusReview.redFlags[0] || "não definido"}`,
        `- Recomendação: ${prometheusReview.recommendation}`,
        ""
      ]
    : [];
  const mnemosyneLines = mnemosyneReview
    ? [
        "Parecer de Hestia:",
        `- Questão de continuidade: ${mnemosyneReview.continuityQuestion}`,
        `- Estado conhecido: ${mnemosyneReview.knownState[0] || "sem estado"}`,
        `- Memória recente: ${mnemosyneReview.latestArtifacts[0] || "sem artefactos recentes"}`,
        `- Lição recordada: ${mnemosyneReview.recalledLessons[0] || "sem lição consolidada"}`,
        ""
      ]
    : [];
  const themisLines = themisReview
    ? [
        "Parecer de Hera:",
        `- Veredito: ${themisReview.verdict}`,
        `- Permitido agora: ${themisReview.allowedNow[0] || "nada relevante"}`,
        `- Exige aprovação: ${themisReview.approvalGated[0] || "nada relevante"}`,
        `- Bloqueado agora: ${themisReview.blockedNow[0] || "nada relevante"}`,
        `- Fronteira crítica: ${themisReview.criticalBoundary}`,
        ""
      ]
    : [];
  const harmoniaLines = harmoniaReview
    ? [
        "Sinal de Apollo:",
        `- Prontidão: ${harmoniaReview.readiness}`,
        `- Veredito: ${harmoniaReview.coherenceVerdict}`,
        `- Falta antes de entregar: ${harmoniaReview.missingPieces[0] || "nada crítico"}`,
        `- Conselho final: ${harmoniaReview.releaseAdvice}`,
        ""
      ]
    : [];
  const aresLines = aresReview
    ? [
        "Parecer de Ares:",
        `- Severidade: ${aresReview.severity}`,
        `- Sinal principal: ${aresReview.primaryWarning}`,
        `- Pressure test: ${aresReview.pressureTest}`,
        `- Próxima ação segura: ${aresReview.safeNextStep}`,
        ""
      ]
    : [];

  const latestReportStatus = context.latestReport?.status || "unknown";
  const currentTask = context.buildTask?.id || "unknown";

  return [
    "ZEUS",
    "",
    `Intenção detetada: ${routed.intent}`,
    `Confiança: ${routed.confidence}`,
    `Motivo: ${routed.reason}`,
    "",
    "Questão a decidir:",
    `Como responder ao pedido do Miguel: "${message}" sem executar ações prematuras.`,
    "",
    "Matérias envolvidas:",
    matters,
    "",
    "Estado operacional:",
    `- Git: ${context.gitStatus}`,
    `- Última task: ${currentTask}`,
    `- Último report: ${latestReportStatus}`,
    "",
    "Olympus convocado:",
    olympus || "- Nenhum agente convocado.",
    "",
    "Opções:",
    options,
    "",
    ...mnemosyneLines,
    ...themisLines,
    ...athenaLines,
    ...daedalusLines,
    ...argusLines,
    ...apolloLines,
    ...plutusLines,
    ...prometheusLines,
    "Riscos / contraditório:",
    risks,
    "",
    ...aresLines,
    ...harmoniaLines,
    "Parecer preliminar de ZEUS:",
    preliminaryJudgement(routed.intent),
    "",
    "Recomendação:",
    recommendedNextStep(routed.intent),
    "",
    "Modo atual:",
    "DELIBERATION_ONLY. Nenhum projeto será criado. Nenhum ficheiro persistente deve ser criado por aprovação. O ZEUS pode deliberar, propor e rever."
  ].join("\n");
}
