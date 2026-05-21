import fs from "fs";
import path from "path";

const today = new Date().toISOString().split("T")[0];

const daily = `# Daily_System_${today}

## Resumo operacional
O AtelierOS processou os dados disponíveis e identificou ações prioritárias para validação humana.

## Atenção imediata
- [[ACTION_Validar_Alteracao_Extra_Moradia_Boavista]]
- [[Inbox_Operacional]]
- [[Automation_Queue]]

## Processos críticos
- [[Moradia_Boavista]]

## Cliente crítico
- [[João_Silva]]

## Riscos ativos
- Alteração fora das revisões incluídas
- Potencial impacto em honorários
- Ambiguidade documental

## Próxima decisão humana
Validar se o pedido de alteração da cozinha deve ser enquadrado como trabalho adicional.

## Ciclo AtelierOS
Email bruto
→ análise de comunicação
→ ScopeGuard
→ evento timeline
→ ação
→ automation queue
→ inbox operacional
→ briefing diário
`;

const outputPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  `Daily_System_${today}.md`
);

fs.writeFileSync(outputPath, daily, "utf-8");

console.log("Daily system criado:");
console.log(outputPath);