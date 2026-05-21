import fs from "fs";
import path from "path";
import {
  analyzeContext,
  ProcessContext,
} from "./contextEngine";

const projectContext: ProcessContext = {
  processo: "Moradia Boavista",
  cliente: "João Silva",
  revisoesConsumidas: 3,
  revisoesIncluidas: 2,
  fase: "Licenciamento",
  honorariosAprovados: true,
  prazoEntregaDias: 4,
  blockers: [],
};

const email = `
Bom dia Arquiteto,

Afinal queremos rever novamente a cozinha,
mudar a janela e testar outra solução.

Obrigado.
`;

const result = analyzeContext(projectContext, email);

const markdown = `# ScopeGuard — Análise de Alteração

## Processo
${projectContext.processo}

## Cliente
${projectContext.cliente}

## Fase
${projectContext.fase}

## Comunicação analisada
${email.trim()}

## Revisões
- Revisões incluídas: ${projectContext.revisoesIncluidas}
- Revisões consumidas: ${projectContext.revisoesConsumidas}

## Resultado da análise
- Assunto: ${result.assunto}
- Tipo de pedido: ${result.tipoPedido}
- Impacto: ${result.impacto}
- Necessita resposta: ${result.necessitaResposta ? "Sim" : "Não"}
- Risco contratual: ${result.riscoContratual ? "Sim" : "Não"}
- Afeta honorários: ${result.afectaHonorarios ? "Sim" : "Não"}
- Prioridade: ${result.prioridade}

## Próxima ação
${result.proximaAcao}

## Leitura AtelierOS
Este pedido deve ser tratado como potencial alteração fora das revisões incluídas.
Não deve ser executado sem validação contratual e eventual enquadramento de honorários adicionais.

## Relações
- [[Moradia Boavista]]
- [[João Silva]]
- [[ScopeGuard]]
- [[Alterações de Cliente]]
`;

const outputPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  "02_ScopeGuard_Alteracao_Cozinha.md"
);

fs.writeFileSync(outputPath, markdown, "utf-8");

console.log("Análise ScopeGuard guardada em:");
console.log(outputPath);