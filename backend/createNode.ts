import fs from "fs";
import path from "path";

function createNode(
  nodeName: string,
  content: string
) {

  const safeName = nodeName
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_");

  const outputPath = path.join(
    process.cwd(),
    "wiki",
    "AtelierOS-Wiki",
    `${safeName}.md`
  );

  if (fs.existsSync(outputPath)) {
    console.log(`Node já existe: ${safeName}`);
    return;
  }

  fs.writeFileSync(
    outputPath,
    content,
    "utf-8"
  );

  console.log(`Node criado: ${safeName}`);
}

createNode(
  "Moradia Boavista",
`# Moradia Boavista

## Tipo
Processo

## Estado
Em curso

## Relações
- [[João Silva]]
- [[ScopeGuard]]
`
);

createNode(
  "João Silva",
`# João Silva

## Tipo
Cliente

## Relações
- [[Moradia Boavista]]
`
);

createNode(
  "ScopeGuard",
`# ScopeGuard

## Tipo
Brain

## Função
Deteção de alterações de âmbito, risco contratual e impacto em honorários.
`
);

createNode(
  "Alterações de Cliente",
`# Alterações de Cliente

## Tipo
Categoria Operacional

## Objetivo
Agrupar pedidos de alteração feitos por clientes.
`
);