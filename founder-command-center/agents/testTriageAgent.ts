import { triageSignal } from "./triageAgent";

const examples = [
  "O sistema criou duas entidades iguais para o mesmo cliente. Parece haver duplicação de memória.",
  "Tenho uma dúvida: não percebo porque este email foi marcado como crítico.",
  "Saiu nova portaria PEPU com impacto em submissões.",
  "Pedido de orçamento para licenciamento de moradia.",
  "Recebido, obrigado."
];

for (const example of examples) {
  console.log("\nINPUT:");
  console.log(example);

  console.log("\nTRIAGE:");
  console.log(triageSignal(example));
}