export interface ActionInput {
  processo: string;
  cliente: string;
  riscoContratual: boolean;
  afectaHonorarios: boolean;
  prioridade: "baixa" | "media" | "alta" | "critica";
  prazoDias: number;
  blocker: boolean;
}

export interface ActionOutput {
  titulo: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  tipo: "responder" | "validar" | "cobrar" | "rever" | "aguardar";
  acao: string;
  precisaAprovacaoHumana: boolean;
}

export function decideNextAction(input: ActionInput): ActionOutput {
  if (input.riscoContratual && input.afectaHonorarios) {
    return {
      titulo: `Validar alteração extra — ${input.processo}`,
      prioridade: input.prioridade,
      tipo: "validar",
      acao:
        "Verificar proposta/contrato, confirmar revisões consumidas e preparar resposta com enquadramento de honorários.",
      precisaAprovacaoHumana: true,
    };
  }

  if (input.blocker) {
    return {
      titulo: `Resolver blocker — ${input.processo}`,
      prioridade: input.prioridade,
      tipo: "rever",
      acao: "Resolver bloqueio antes de avançar com o processo.",
      precisaAprovacaoHumana: true,
    };
  }

  return {
    titulo: `Responder cliente — ${input.processo}`,
    prioridade: input.prioridade,
    tipo: "responder",
    acao: "Preparar resposta ao cliente e aguardar validação.",
    precisaAprovacaoHumana: true,
  };
}