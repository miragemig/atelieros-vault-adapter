import { morningBriefingPrompt, BriefingContext } from "./morningBriefing";

const mockContext: BriefingContext = {
  nomeGabinete: "Arquimla",
  nomeArquitecto: "Miguel",
  dataHoje: "Segunda-feira, 19 Maio 2026",

  processos: [
    {
      nome: "Moradia Boavista",
      estado: "em curso",
      proximaAccao: "Responder ofício da CMP",
    },
    {
      nome: "Legalização Foz",
      estado: "bloqueado",
      proximaAccao: "Aguardar especialidade estruturas",
    },
  ],

  comunicacoesNovas: [
    {
      assunto: "Cliente pediu alteração cozinha",
      urgencia: "alta",
    },
    {
      assunto: "Ofício CMP recebido",
      urgencia: "critica",
    },
  ],

  rascunhosProntos: 3,
};

const briefing = morningBriefingPrompt(mockContext);

console.log(briefing);