export interface ProcessContext {
  processo: string;
  cliente: string;
  revisoesConsumidas: number;
  revisoesIncluidas: number;
  fase: string;
  honorariosAprovados: boolean;
  prazoEntregaDias: number;
  blockers: string[];
}

export interface EmailAnalysis {
  assunto: string;
  tipoPedido: "alteracao" | "duvida" | "urgencia" | "reclamacao";
  impacto: "baixo" | "medio" | "alto";
  necessitaResposta: boolean;
  riscoContratual: boolean;
  afectaHonorarios: boolean;
  prioridade: "baixa" | "media" | "alta" | "critica";
  proximaAcao: string;
}

export function analyzeContext(
  process: ProcessContext,
  emailText: string
): EmailAnalysis {
  const lower = emailText.toLowerCase();

  const pediuAlteracao =
    lower.includes("alter") ||
    lower.includes("mudar") ||
    lower.includes("rever");

  const revisoesEsgotadas =
    process.revisoesConsumidas >= process.revisoesIncluidas;

  const prazoCritico = process.prazoEntregaDias <= 5;

  return {
    assunto: pediuAlteracao ? "Pedido de alteração" : "Comunicação geral",
    tipoPedido: pediuAlteracao ? "alteracao" : "duvida",
    impacto: revisoesEsgotadas || prazoCritico ? "alto" : "medio",
    necessitaResposta: true,
    riscoContratual: revisoesEsgotadas,
    afectaHonorarios: revisoesEsgotadas,
    prioridade: prazoCritico ? "critica" : "alta",
    proximaAcao: revisoesEsgotadas
      ? "Validar impacto contratual e honorários antes de executar."
      : "Responder cliente e validar alteração."
  };
}