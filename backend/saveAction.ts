import fs from "fs";
import path from "path";
import { decideNextAction } from "./actionEngine";

const action = decideNextAction({
  processo: "Moradia_Boavista",
  cliente: "João_Silva",
  riscoContratual: true,
  afectaHonorarios: true,
  prioridade: "critica",
  prazoDias: 4,
  blocker: false,
});

const markdown = `# Ação — ${action.titulo}

## Prioridade
${action.prioridade}

## Tipo
${action.tipo}

## Ação recomendada
${action.acao}

## Aprovação humana
${action.precisaAprovacaoHumana ? "Sim" : "Não"}

## Estado
Pendente

## Relações
- [[Moradia_Boavista]]
- [[João_Silva]]
- [[ScopeGuard]]
- [[02_ScopeGuard_Alteracao_Cozinha]]
`;

const outputPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  "ACTION_Validar_Alteracao_Extra_Moradia_Boavista.md"
);

fs.writeFileSync(outputPath, markdown, "utf-8");

console.log("Ação guardada em:");
console.log(outputPath);