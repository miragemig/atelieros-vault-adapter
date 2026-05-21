import fs from "fs";
import path from "path";

const emailPath = path.join(
  process.cwd(),
  "raw_sources",
  "emails",
  "email_cliente_alteracao_cozinha.txt"
);

const email = fs.readFileSync(emailPath, "utf-8");

const output = `# Análise de Comunicação — Pedido de Alteração

## Fonte
raw_sources/emails/email_cliente_alteracao_cozinha.txt

## Tipo
Email de cliente

## Resumo
O cliente manifesta insatisfação com a solução da cozinha e solicita nova avaliação da distribuição, abertura para a sala e posição da janela.

## Pedido identificado
- Rever solução da cozinha.
- Tornar cozinha mais aberta para a sala.
- Rever posição da janela.
- Testar nova distribuição.

## Classificação AtelierOS
Possível alteração de âmbito / ScopeGuard.

## Risco
Alto.

## Motivo do risco
O cliente usa formulação vaga: "não era bem isto que tínhamos falado".
Isto pode gerar ambiguidade documental e tentativa de reabrir uma solução já anteriormente estabilizada.

## Ação recomendada
1. Não alterar imediatamente.
2. Pedir identificação objetiva dos pontos pretendidos.
3. Verificar proposta/contrato.
4. Verificar número de revisões já incluídas e consumidas.
5. Enquadrar eventual nova solução como alteração adicional, se aplicável.

## Resposta sugerida
Caro João,

Acuso a receção do seu email.

Para podermos analisar o pedido com rigor, agradeço que identifique de forma objetiva os pontos que entende não corresponderem à solução anteriormente validada, nomeadamente quanto à organização da cozinha, relação com a sala e posição da janela.

Sem prejuízo dessa análise, importa distinguir entre eventual correção de desconformidade objetiva e nova alteração à solução anteriormente estabilizada.

Caso se trate de nova reformulação, a mesma deverá ser previamente enquadrada quanto ao impacto em prazo e honorários, nos termos da proposta aprovada.

Com os melhores cumprimentos,

Miguel Sousa
ARQUIMLA
`;

const outputPath = path.join(
  process.cwd(),
  "wiki",
  "AtelierOS-Wiki",
  "01_Email_Cliente_Alteracao_Cozinha.md"
);

fs.writeFileSync(outputPath, output, "utf-8");

console.log("Análise criada em:");
console.log(outputPath);