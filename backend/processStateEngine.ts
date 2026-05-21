export type ProcessState =
  | "em_curso"
  | "bloqueado"
  | "aguardar_cliente"
  | "aguardar_camara"
  | "aguardar_especialidade"
  | "pronto_submissao"
  | "concluido";

export interface ProcessStateInput {
  blockers: string[];
  prazoDias: number | null;
  aguardaCliente: boolean;
  aguardaCamara: boolean;
  aguardaEspecialidade: boolean;
  documentosEmFalta: number;
  documentosPorValidar: number;
}

export interface ProcessStateOutput {
  estado: ProcessState;
  prioridade: "baixa" | "media" | "alta" | "critica";
  motivo: string;
  proximaAcao: string;
}

export function evaluateProcessState(
  input: ProcessStateInput
): ProcessStateOutput {
  if (input.blockers.length > 0 || input.documentosEmFalta > 0) {
    return {
      estado: "bloqueado",
      prioridade: input.prazoDias !== null && input.prazoDias <= 5 ? "critica" : "alta",
      motivo: "Existem blockers ou documentos em falta.",
      proximaAcao: "Resolver blockers antes de avançar.",
    };
  }

  if (input.aguardaEspecialidade) {
    return {
      estado: "aguardar_especialidade",
      prioridade: input.prazoDias !== null && input.prazoDias <= 5 ? "alta" : "media",
      motivo: "Processo depende de especialidade externa.",
      proximaAcao: "Pedir atualização ao técnico responsável.",
    };
  }

  if (input.aguardaCamara) {
    return {
      estado: "aguardar_camara",
      prioridade: "baixa",
      motivo: "Processo aguarda resposta da Câmara.",
      proximaAcao: "Monitorizar prazo e comunicação municipal.",
    };
  }

  if (input.aguardaCliente) {
    return {
      estado: "aguardar_cliente",
      prioridade: "media",
      motivo: "Processo depende de resposta ou validação do cliente.",
      proximaAcao: "Fazer follow-up ao cliente.",
    };
  }

  if (input.documentosPorValidar > 0) {
    return {
      estado: "em_curso",
      prioridade: "media",
      motivo: "Existem documentos por validar.",
      proximaAcao: "Validar documentos pendentes.",
    };
  }

  return {
    estado: "pronto_submissao",
    prioridade: "alta",
    motivo: "Sem blockers e sem documentos pendentes.",
    proximaAcao: "Preparar pacote de submissão.",
  };
}