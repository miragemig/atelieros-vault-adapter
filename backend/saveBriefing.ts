import fs from "fs";
import path from "path";
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

const outputPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  "00_Morning_Briefing.md"
);

fs.writeFileSync(outputPath, briefing, "utf-8");

console.log(`Briefing guardado em: ${outputPath}`);