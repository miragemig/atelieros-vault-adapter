export type ZeusIntent =
  | "status"
  | "strategic_deliberation"
  | "new_project"
  | "continue_project"
  | "website_project"
  | "marketing_plan"
  | "software_project"
  | "automation_project"
  | "build_pipeline"
  | "risk_review"
  | "knowledge_request"
  | "finance_analysis"
  | "security_review"
  | "unsupported"
  | "general_advice";

export type RoutedIntent = {
  intent: ZeusIntent;
  confidence: "low" | "medium" | "high";
  olympusAgentIds: string[];
  internalOlympusAgentIds: string[];
  requiresApproval: boolean;
  dangerous: boolean;
  reason: string;
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function routeIntent(message: string): RoutedIntent {
  const text = message.toLowerCase();

  if (includesAny(text, ["estado", "status", "onde estamos"])) {
    return {
      intent: "status",
      confidence: "high",
      olympusAgentIds: ["hestia", "artemis", "hera"],
      internalOlympusAgentIds: ["mnemosyne", "argus", "themis"],
      requiresApproval: false,
      dangerous: false,
      reason: "Pedido de estado operacional."
    };
  }

  // Deliberation must come before domain-specific execution intents.
  if (
    includesAny(text, ["estou indeciso", "indeciso", "delibera", "compara", "o que faço primeiro", "qual é a prioridade", "prioridade"]) ||
    (text.includes("entre") && text.includes("ou"))
  ) {
    return {
      intent: "strategic_deliberation",
      confidence: "high",
      olympusAgentIds: ["athena", "ares", "hera", "hestia", "hephaestus"],
      internalOlympusAgentIds: ["athena", "ares", "themis", "mnemosyne", "daedalus", "hephaestus"],
      requiresApproval: false,
      dangerous: false,
      reason: "Pedido de deliberação entre opções ou prioridades."
    };
  }

  // Specific intents must come before generic project intents.

  if (includesAny(text, ["site", "website", "página de internet", "pagina de internet"])) {
    return {
      intent: "website_project",
      confidence: "high",
      olympusAgentIds: ["athena", "apollo", "hephaestus", "ares", "hera", "aphrodite"],
      internalOlympusAgentIds: ["athena", "apollo", "daedalus", "hephaestus", "ares", "themis"],
      requiresApproval: true,
      dangerous: false,
      reason: "Pedido de projeto de website/página."
    };
  }

  if (includesAny(text, ["marketing", "campanha", "conteúdo", "conteudo"])) {
    return {
      intent: "marketing_plan",
      confidence: "high",
      olympusAgentIds: ["athena", "apollo", "ares", "hestia", "hera", "aphrodite"],
      internalOlympusAgentIds: ["athena", "apollo", "ares", "mnemosyne", "themis"],
      requiresApproval: true,
      dangerous: false,
      reason: "Pedido de plano de marketing/comunicação."
    };
  }

  if (includesAny(text, ["app", "software", "aplicação", "aplicacao", "ui", "ux", "interface"])) {
    return {
      intent: "software_project",
      confidence: "high",
      olympusAgentIds: ["athena", "hephaestus", "ares", "hera", "aphrodite"],
      internalOlympusAgentIds: ["athena", "daedalus", "hephaestus", "ares", "themis"],
      requiresApproval: true,
      dangerous: false,
      reason: "Pedido de criação de software, interface ou experiência."
    };
  }

  if (includesAny(text, ["automatizar", "automação", "automacao"])) {
    return {
      intent: "automation_project",
      confidence: "high",
      olympusAgentIds: ["hephaestus", "athena", "ares", "hera", "poseidon"],
      internalOlympusAgentIds: ["hephaestus", "athena", "ares", "themis"],
      requiresApproval: true,
      dangerous: false,
      reason: "Pedido de automação."
    };
  }

  if (text.includes("continuar") && text.includes("projeto")) {
    return {
      intent: "continue_project",
      confidence: "high",
      olympusAgentIds: ["hestia", "athena", "hephaestus", "ares"],
      internalOlympusAgentIds: ["mnemosyne", "athena", "hephaestus", "ares"],
      requiresApproval: false,
      dangerous: false,
      reason: "Pedido para continuar projeto existente."
    };
  }

  if (includesAny(text, ["novo projeto", "começar um projeto", "vamos começar"])) {
    return {
      intent: "new_project",
      confidence: "high",
      olympusAgentIds: ["athena", "hestia", "ares", "hera"],
      internalOlympusAgentIds: ["athena", "mnemosyne", "ares", "themis"],
      requiresApproval: true,
      dangerous: false,
      reason: "Pedido para iniciar projeto novo."
    };
  }

  if (includesAny(text, ["pipeline", "build", "código", "codigo"])) {
    return {
      intent: "build_pipeline",
      confidence: "medium",
      olympusAgentIds: ["hephaestus", "hera", "ares", "hestia"],
      internalOlympusAgentIds: ["hephaestus", "themis", "ares", "mnemosyne"],
      requiresApproval: true,
      dangerous: false,
      reason: "Pedido relacionado com build/código/pipeline."
    };
  }

  if (includesAny(text, ["risco", "seguro", "segurança", "seguranca"])) {
    return {
      intent: "security_review",
      confidence: "high",
      olympusAgentIds: ["ares", "hera", "hephaestus", "artemis", "poseidon"],
      internalOlympusAgentIds: ["ares", "themis", "hephaestus", "argus"],
      requiresApproval: false,
      dangerous: false,
      reason: "Pedido de análise de risco/segurança."
    };
  }

  if (includesAny(text, ["finanças", "financas", "investir", "dinheiro"])) {
    return {
      intent: "finance_analysis",
      confidence: "medium",
      olympusAgentIds: ["demeter", "athena", "ares", "hera"],
      internalOlympusAgentIds: ["plutus", "athena", "ares", "themis"],
      requiresApproval: false,
      dangerous: false,
      reason: "Pedido de análise financeira."
    };
  }

  if (includesAny(text, ["livro", "fonte", "conhecimento", "estuda"])) {
    return {
      intent: "knowledge_request",
      confidence: "medium",
      olympusAgentIds: ["hestia", "athena", "ares", "hephaestus", "artemis"],
      internalOlympusAgentIds: ["mnemosyne", "athena", "ares", "prometheus"],
      requiresApproval: false,
      dangerous: false,
      reason: "Pedido de estudo/conhecimento/fontes."
    };
  }

  if (includesAny(text, ["faz café", "faz cafe"])) {
    return {
      intent: "unsupported",
      confidence: "high",
      olympusAgentIds: ["hera"],
      internalOlympusAgentIds: ["themis"],
      requiresApproval: false,
      dangerous: false,
      reason: "Comando não suportado: não existe ferramenta ligada a máquina de café."
    };
  }

  return {
    intent: "general_advice",
    confidence: "low",
    olympusAgentIds: ["athena", "ares", "hestia"],
    internalOlympusAgentIds: ["athena", "ares", "mnemosyne"],
    requiresApproval: false,
    dangerous: false,
    reason: "Pedido genérico ou ambíguo."
  };
}
