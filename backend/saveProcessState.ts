import fs from "fs";
import path from "path";

import {
  evaluateProcessState,
} from "./processStateEngine";

import {
  upsertSection,
} from "./sectionEngine";

const processName =
  "Moradia_Boavista";

const state =
  evaluateProcessState({
    blockers: [
      "Pedido de alteração extra sem validação contratual"
    ],

    prazoDias: 4,

    aguardaCliente: false,
    aguardaCamara: false,
    aguardaEspecialidade: false,

    documentosEmFalta: 0,

    documentosPorValidar: 2,
  });

const processPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  `${processName}.md`
);

const existing =
  fs.existsSync(processPath)
    ? fs.readFileSync(
        processPath,
        "utf-8"
      )
    : `# ${processName}`;

const section = `
# Estado Operacional

## Estado
${state.estado}

## Prioridade
${state.prioridade}

## Motivo
${state.motivo}

## Próxima ação
${state.proximaAcao}

## Última avaliação
${new Date().toISOString()}
`;

const updated =
  upsertSection(
    existing,
    "estado_operacional",
    section
  );

fs.writeFileSync(
  processPath,
  updated,
  "utf-8"
);

console.log(
  "Estado operacional atualizado."
);