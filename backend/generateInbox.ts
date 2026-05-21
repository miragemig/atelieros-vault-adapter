import fs from "fs";
import path from "path";

const inboxItems = [
  {
    tipo: "ScopeGuard",
    prioridade: "critica",
    titulo:
      "Validar alteração extra cozinha",
    processo:
      "Moradia_Boavista",
    acao:
      "Validar impacto contratual e honorários.",
  },

  {
    tipo: "Ofício",
    prioridade: "alta",
    titulo:
      "Responder ofício CMP",
    processo:
      "Moradia_Boavista",
    acao:
      "Preparar resposta até sexta-feira.",
  },

  {
    tipo: "Draft",
    prioridade: "media",
    titulo:
      "Memória descritiva pronta",
    processo:
      "Legalizacao_Foz",
    acao:
      "Validar antes de exportar.",
  },
];

const markdown = `# Inbox_Operacional

## Objetivo
Centro operacional do AtelierOS.

Tudo o que exige atenção do gabinete aparece aqui.

---

${inboxItems.map(item => `
## ${item.titulo}

- Tipo: ${item.tipo}
- Prioridade: ${item.prioridade}
- Processo: [[${item.processo}]]

### Ação
${item.acao}
`).join("\n")}

`;

const outputPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  "Inbox_Operacional.md"
);

fs.writeFileSync(
  outputPath,
  markdown,
  "utf-8"
);

console.log(
  "Inbox operacional criada."
);