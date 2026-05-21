import fs from "fs";
import path from "path";
import { normalizeEntityName } from "./entityRegistry";

const emailPath = path.join(
  process.cwd(),
  "raw_sources",
  "emails",
  "email_cliente_alteracao_cozinha.txt"
);

const text = fs.readFileSync(emailPath, "utf-8");

const entities = {
  clientes: [] as string[],
  assuntos: [] as string[],
  riscos: [] as string[],
};

if (text.includes("João Silva")) {
  entities.clientes.push(normalizeEntityName("João Silva"));
}

if (text.toLowerCase().includes("cozinha")) {
  entities.assuntos.push(normalizeEntityName("Alteração Cozinha"));
}

if (text.toLowerCase().includes("alter")) {
  entities.riscos.push("Possível alteração de âmbito");
}

const markdown = `# Entidades Extraídas — Normalizadas

## Fonte
raw_sources/emails/email_cliente_alteracao_cozinha.txt

## Clientes
${entities.clientes.map(c => `- [[${c}]]`).join("\n")}

## Assuntos
${entities.assuntos.map(a => `- [[${a}]]`).join("\n")}

## Riscos
${entities.riscos.map(r => `- ${r}`).join("\n")}

## Relações sugeridas
- [[Moradia_Boavista]]
- [[ScopeGuard]]
- [[Alterações_Cliente]]
`;

const outputPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  "03_Entity_Extraction_Normalized.md"
);

fs.writeFileSync(outputPath, markdown, "utf-8");

console.log("Entity extraction normalizada criada.");
console.log(outputPath);