import fs from "fs";
import path from "path";

const processName = "Moradia_Boavista";

const processPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  `${processName}.md`
);

let existing = "";

if (fs.existsSync(processPath)) {
  existing = fs.readFileSync(processPath, "utf-8");
}

const updateBlock = `

---

# Atualização Automática

## Último evento
[[EMAIL_PROCESSED_novo_email_teste]]

## Última ação sugerida
[[ACTION_Validar_Alteracao_Extra_Moradia_Boavista]]

## Queue
[[Automation_Queue]]

## Inbox
[[Inbox_Operacional]]

## Último risco identificado
Alteração potencialmente fora do âmbito contratado.

## Próxima decisão humana
Validar impacto contratual antes de executar alteração.

## Entidades relacionadas
- [[João_Silva]]
- [[ScopeGuard]]
- [[Alterações_Cliente]]

## Última atualização
${new Date().toISOString()}
`;

const finalContent = existing + updateBlock;

fs.writeFileSync(
  processPath,
  finalContent,
  "utf-8"
);

console.log("Workspace do processo atualizado:");
console.log(processPath);