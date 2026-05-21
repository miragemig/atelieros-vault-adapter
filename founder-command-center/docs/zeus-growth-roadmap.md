# ZEUS Growth Roadmap

## Decisão principal

O ZEUS deve crescer por fases curtas, auditáveis e reversíveis.

O objetivo não é absorver produtos externos. O objetivo é consolidar capacidades que aumentem utilidade operacional real sem perder controlo humano, clareza arquitetural e simplicidade de operação.

## Regras de crescimento

Cada nova camada só entra quando:

1. melhora um fluxo real já usado pelo Miguel;
2. pode ser validada localmente;
3. tem logs e fronteiras claras;
4. não força reescrita ampla do núcleo;
5. respeita aprovação explícita nas ações críticas.

## Anti-objetivo

Não transformar o ZEUS numa plataforma larga antes de fechar o seu núcleo operacional.

O caminho certo é:

1. estabilizar o núcleo local;
2. consolidar runtime e estado central;
3. melhorar arranque, diagnóstico e continuidade;
4. só depois abrir extensibilidade e canais adicionais.

## Fase 0 — Estabilização do núcleo atual

### Objetivo

Fechar o que já existe antes de abrir novas superfícies.

### O que tem de fechar

- arranque limpo;
- `status`, `help` e UI estáveis;
- gates de aprovação coerentes;
- memória operacional básica;
- logs auditáveis;
- `computer/browser/files` com comportamento previsível.

### Critério de saída

O ZEUS tem de conseguir:

- interpretar pedido;
- deliberar;
- preparar;
- abrir ferramenta;
- registar estado;
- e parar em segurança sem comportamento opaco.

## Fase 1 — Runtime local sério

### Objetivo

Dar ao ZEUS uma base operacional local robusta, com fronteiras explícitas entre pensamento, execução e ação externa.

### O que entra

- noção clara de sessão principal;
- boundaries entre:
  - deliberação;
  - runtime local;
  - ação externa;
- diagnóstico básico da sessão;
- estrutura de estado mais disciplinada;
- logs por ação.

### Implementação no ZEUS

- consolidar `Poseidon`, `Deméter`, `Hestia`, `Hera`, `Hephaestus`, `Hermes`;
- criar `doctor` mínimo:
  - checks de Python;
  - checks de Node;
  - checks de Playwright;
  - checks de portas/UI;
  - checks de paths críticos;
- unificar logs locais por ação.

### O que não entra ainda

- multi-canal;
- daemon complexo;
- sandboxing por sessão;
- onboarding completo.

## Fase 2 — Control Plane do ZEUS

### Objetivo

Transformar o ZEUS de conjunto de comandos num sistema com estado operacional central.

### O que entra

- `gateway state`;
- registo de sessões internas;
- fila de ações preparadas;
- logs de eventos;
- separação entre:
  - command layer;
  - action layer;
  - audit layer.

### Implementação no ZEUS

- `zeusGatewayState.json` ou equivalente;
- `event journal` local;
- status console a ler do control plane;
- unificação do que hoje está espalhado por:
  - runtime;
  - Hermes;
  - build system;
  - patch system.

### Critério de saída

O ZEUS tem um centro operacional real, não apenas uma coleção de scripts.

## Fase 3 — Onboarding e Doctor

### Objetivo

Remover fricção de setup e diagnóstico.

### O que entra

- onboarding guiado do ZEUS;
- `doctor` mais sério;
- checklist de configuração;
- deteção de problemas comuns.

### Implementação no ZEUS

- `zeus onboard`;
- `zeus doctor`.

### O onboarding deve configurar

- caminhos locais;
- Python/venv;
- Node/npm;
- Playwright;
- config do ZEUS;
- chaves mínimas;
- browser/runtime readiness.

### O doctor deve verificar

- integridade de dependências;
- UI/server;
- runtime Python;
- portas;
- diretórios de memória/logs;
- permissões básicas;
- estado de módulos críticos.

## Fase 4 — Skills, Hooks e Extensibilidade

### Objetivo

Dar extensibilidade real ao ZEUS sem reescrever o core a cada nova necessidade.

### O que entra

- skill registry local;
- hook points internos;
- manifests simples para extensões;
- permission model por extensão.

### Implementação no ZEUS

- `skills/` locais;
- `hooks/` para:
  - before action;
  - after action;
  - before send;
  - after compose;
  - memory capture;
  - patch candidate review.

### Critério de saída

Uma capacidade nova deve entrar como extensão pequena e não como refactor transversal.

## Fase 5 — Inputs confiáveis e superfícies externas

### Objetivo

Aceitar inputs externos de forma segura e controlada.

### O que entra

- allowlists;
- trusted senders;
- perfis de risco por origem;
- distinção entre sessão principal e periféricas.

### Implementação no ZEUS

- políticas por canal;
- confirmação forte para ações com efeito externo;
- separação entre:
  - input recebido;
  - interpretação;
  - ação preparada;
  - ação autorizada.

## Fase 6 — Canais reais

### Objetivo

Abrir canais adicionais só depois do núcleo local estar sólido.

### O que entra

- integrações de mensagens com logs, gates e estados claros;
- painel de sessões/canais;
- trilho auditável por canal.

### Regra

Cada novo canal entra primeiro como leitura e preparação, não como execução cega.

## Fase 7 — Sessões não principais e isolamento

### Objetivo

Separar melhor contextos e reduzir risco operacional.

### O que entra

- sessões periféricas;
- isolamento por contexto;
- políticas específicas por superfície;
- execução mais compartimentada.

## Fase 8 — Excelência final

### Objetivo

Fechar o ZEUS como centro operacional maduro.

### Sinais de maturidade

- arranque previsível;
- diagnóstico claro;
- deliberação forte;
- runtime local robusto;
- memória útil;
- canais controlados;
- extensibilidade limpa;
- audit trail íntegro;
- UI rápida e operacional.

## Ordem certa agora

O próximo trabalho certo é:

1. implementar `zeus doctor`;
2. criar `gateway state` e `event journal`;
3. consolidar runtime, Hermes, logs e memória básica;
4. só depois abrir extensibilidade e novos canais.
