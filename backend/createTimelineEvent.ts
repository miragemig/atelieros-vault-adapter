import fs from "fs";
import path from "path";

const today = new Date();

const date =
  today.toISOString().split("T")[0];

const event = `# Evento — Pedido Alteração Cozinha

## Data
${date}

## Tipo
Alteração de Cliente

## Processo
[[Moradia_Boavista]]

## Cliente
[[João_Silva]]

## Resumo
Cliente solicitou revisão da cozinha, alteração da janela e nova distribuição.

## Impacto
- Possível alteração de âmbito
- Potencial impacto em honorários
- Necessita validação contratual

## Relacionado
- [[ScopeGuard]]
- [[Alterações_Cliente]]
- [[02_ScopeGuard_Alteracao_Cozinha]]

`;

const outputPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  `EVENT_${date}_Alteracao_Cozinha.md`
);

fs.writeFileSync(
  outputPath,
  event,
  "utf-8"
);

console.log(
  "Evento timeline criado:"
);

console.log(outputPath);