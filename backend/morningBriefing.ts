export interface BriefingContext {
  nomeGabinete: string;
  nomeArquitecto: string;
  dataHoje: string;

  processos: {
    nome: string;
    estado: string;
    proximaAccao: string;
  }[];

  comunicacoesNovas: {
    assunto: string;
    urgencia: string;
  }[];

  rascunhosProntos: number;
}

export const morningBriefingPrompt = (ctx: BriefingContext): string => {
  return `
Bom dia, ${ctx.nomeArquitecto}.

O gabinete "${ctx.nomeGabinete}" tem hoje:
- ${ctx.processos.length} processos activos
- ${ctx.comunicacoesNovas.length} comunicações novas
- ${ctx.rascunhosProntos} rascunhos prontos

━━━ PROCESSOS ━━━━━━━━━━━

${ctx.processos
  .map((p) => `• ${p.nome} — ${p.estado} — Próxima acção: ${p.proximaAccao}`)
  .join("\n")}

━━━ COMUNICAÇÕES ━━━━━━━━

${ctx.comunicacoesNovas
  .map((c) => `• [${c.urgencia.toUpperCase()}] ${c.assunto}`)
  .join("\n")}
`;
};