export type TriageCategory =
  | "critical"
  | "action_required"
  | "informational"
  | "archive_only"
  | "bug"
  | "feature_request"
  | "risk"
  | "legal"
  | "commercial"
  | "support_question";

export interface TriageResult {
  category: TriageCategory;
  priority: "baixa" | "media" | "alta" | "critica";
  requiresHuman: boolean;
  shouldCreateMemory: boolean;
  shouldNotify: boolean;
  suggestedAction: string;
  explanation: string;
  matchedSignals: string[];
}

export function triageSignal(content: string): TriageResult {
  const lower = content.toLowerCase();

  if (
    lower.includes("bug") ||
    lower.includes("erro") ||
    lower.includes("falha") ||
    lower.includes("duplicação") ||
    lower.includes("duplicacao")
  ) {
    return {
      category: "bug",
      priority: "critica",
      requiresHuman: true,
      shouldCreateMemory: true,
      shouldNotify: true,
      suggestedAction: "Investigar bug reportado e criar tarefa de correção.",
      explanation: "Foi classificado como bug porque contém sinais de erro, falha ou duplicação.",
      matchedSignals: ["bug/erro/falha/duplicação"]
    };
  }

  if (
    lower.includes("não percebo") ||
    lower.includes("nao percebo") ||
    lower.includes("dúvida") ||
    lower.includes("duvida") ||
    lower.includes("como faço") ||
    lower.includes("como faco") ||
    lower.includes("porque") ||
    lower.includes("porquê") ||
    lower.includes("explicar") ||
    lower.includes("explicasse")
  ) {
    return {
      category: "support_question",
      priority: "media",
      requiresHuman: false,
      shouldCreateMemory: true,
      shouldNotify: false,
      suggestedAction: "Responder ao utilizador e avaliar se deve virar documentação ou explicação de UI.",
      explanation: "Foi classificado como dúvida de suporte porque o texto pede explicação ou manifesta falta de compreensão.",
      matchedSignals: ["dúvida/não percebo/porque/explicar"]
    };
  }

  if (
    lower.includes("prazo") ||
    lower.includes("urgente") ||
    lower.includes("crítico") ||
    lower.includes("critico") ||
    lower.includes("bloqueado")
  ) {
    return {
      category: "critical",
      priority: "critica",
      requiresHuman: true,
      shouldCreateMemory: true,
      shouldNotify: true,
      suggestedAction: "Analisar imediatamente e definir ação prioritária.",
      explanation: "Foi classificado como crítico porque contém sinais de prazo, urgência, bloqueio ou criticidade operacional.",
      matchedSignals: ["prazo/urgente/crítico/bloqueado"]
    };
  }

  if (
    lower.includes("sugestão") ||
    lower.includes("sugestao") ||
    lower.includes("melhoria") ||
    lower.includes("nova função") ||
    lower.includes("nova funcao")
  ) {
    return {
      category: "feature_request",
      priority: "media",
      requiresHuman: false,
      shouldCreateMemory: true,
      shouldNotify: false,
      suggestedAction: "Avaliar como possível melhoria de produto.",
      explanation: "Foi classificado como pedido de melhoria porque contém sugestão, melhoria ou pedido de nova função.",
      matchedSignals: ["sugestão/melhoria/nova função"]
    };
  }

  if (
    lower.includes("orçamento") ||
    lower.includes("orcamento") ||
    lower.includes("proposta") ||
    lower.includes("preço") ||
    lower.includes("preco")
  ) {
    return {
      category: "commercial",
      priority: "media",
      requiresHuman: true,
      shouldCreateMemory: true,
      shouldNotify: false,
      suggestedAction: "Classificar como oportunidade comercial e preparar resposta.",
      explanation: "Foi classificado como comercial porque contém sinais de orçamento, proposta ou preço.",
      matchedSignals: ["orçamento/proposta/preço"]
    };
  }

  if (
    lower.includes("lei") ||
    lower.includes("portaria") ||
    lower.includes("pepu") ||
    lower.includes("rjue") ||
    lower.includes("câmara") ||
    lower.includes("camara")
  ) {
    return {
      category: "legal",
      priority: "alta",
      requiresHuman: true,
      shouldCreateMemory: true,
      shouldNotify: true,
      suggestedAction: "Analisar impacto legal/municipal e propor atualização do produto.",
      explanation: "Foi classificado como legal/municipal porque menciona lei, portaria, PEPU, RJUE ou Câmara.",
      matchedSignals: ["lei/portaria/PEPU/RJUE/Câmara"]
    };
  }

  if (
    lower.includes("risco") ||
    lower.includes("contrato") ||
    lower.includes("honorários") ||
    lower.includes("honorarios") ||
    lower.includes("alteração extra") ||
    lower.includes("alteracao extra")
  ) {
    return {
      category: "risk",
      priority: "alta",
      requiresHuman: true,
      shouldCreateMemory: true,
      shouldNotify: true,
      suggestedAction: "Avaliar risco operacional/contratual e criar ação de validação.",
      explanation: "Foi classificado como risco porque menciona contrato, honorários, alteração extra ou risco operacional.",
      matchedSignals: ["risco/contrato/honorários/alteração extra"]
    };
  }

  if (
    lower.includes("obrigado") ||
    lower.includes("recebido") ||
    lower.includes("confirmo")
  ) {
    return {
      category: "archive_only",
      priority: "baixa",
      requiresHuman: false,
      shouldCreateMemory: false,
      shouldNotify: false,
      suggestedAction: "Arquivar sem interromper.",
      explanation: "Foi classificado para arquivo porque parece ser apenas confirmação ou agradecimento.",
      matchedSignals: ["obrigado/recebido/confirmo"]
    };
  }

  return {
    category: "informational",
    priority: "baixa",
    requiresHuman: false,
    shouldCreateMemory: true,
    shouldNotify: false,
    suggestedAction: "Guardar como informação útil, sem interrupção.",
    explanation: "Foi classificado como informativo porque não contém sinais fortes de urgência, risco, bug, pedido comercial ou ação crítica.",
    matchedSignals: []
  };
}