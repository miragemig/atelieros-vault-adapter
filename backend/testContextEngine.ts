import {
  analyzeContext,
  ProcessContext,
} from "./contextEngine";

const process: ProcessContext = {
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

const result = analyzeContext(process, email);

console.log(result);