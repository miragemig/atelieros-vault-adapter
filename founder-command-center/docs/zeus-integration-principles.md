# ZEUS Integration Principles

## Objetivo

Este documento define o que deve entrar no ZEUS e o que deve ficar de fora quando avaliamos capacidades externas, padrões ou bases já existentes.

## Regra geral

Não copiar sistemas inteiros.

Absorver apenas:

- padrões úteis;
- conceitos operacionais;
- superfícies valiosas;
- e, quando fizer sentido, reimplementações limpas de módulos bem delimitados.

## Critérios de entrada

Uma capacidade só deve entrar se cumprir a maioria destes critérios:

- aumenta utilidade operacional real;
- encaixa na filosofia local-first;
- mantém controlo humano nos pontos críticos;
- reduz carga mental do Miguel;
- pode ser validada de forma objetiva;
- não força dependência estrutural desnecessária.

## Critérios de exclusão

Uma capacidade deve ficar de fora quando:

- é principalmente espetáculo;
- aumenta largura sem fechar o núcleo;
- impõe arquitetura demasiado larga;
- adiciona complexidade antes de necessidade real;
- cria dependência forte de tooling ou produto alheio;
- não melhora o fluxo principal do ZEUS.

## O que entra agora

### Runtime local

Entram capacidades de:

- controlo do browser;
- controlo do computador;
- abertura de aplicações;
- gestão de ficheiros;
- leitura operacional básica do estado local.

### Núcleo operacional

Entram capacidades de:

- `gateway state`;
- logs de eventos;
- memória operacional;
- filas de ações preparadas;
- políticas de aprovação;
- diagnóstico do sistema.

### UI operacional

Entram capacidades de:

- command chamber;
- painéis rápidos;
- estado visível do sistema;
- acesso curto às ações principais;
- sensação de ferramenta sempre pronta.

### Extensibilidade

Entram capacidades de:

- hooks;
- skill registry;
- manifests simples;
- permissões por extensão;
- trilho auditável por integração.

## O que entra mais tarde

- canais reais adicionais;
- sessões separadas;
- isolamento mais forte por contexto;
- plugins de canal;
- dashboards administrativos mais largos.

## O que não entra

- plataformas externas inteiras;
- múltiplos sistemas paralelos dentro do ZEUS;
- abstrações genéricas sem prova de uso;
- enxames de agentes sem necessidade concreta;
- identidade visual ou branding de terceiros;
- mecanismos opacos difíceis de auditar.

## Prioridade real de incorporação

### Prioridade 1

- runtime local sério;
- control plane;
- doctor/onboarding;
- logs e memória básica.

### Prioridade 2

- UI operacional mais rápida;
- painéis melhores;
- experiência de comando mais fluida.

### Prioridade 3

- hooks, skills e extensibilidade;
- integrações de canal;
- dashboards administrativos.

## Mapa por módulo do ZEUS

### ZEUS Runtime

Deve receber:

- browser;
- computer;
- files;
- open-app;
- preflight checks.

### ZEUS Control Plane

Deve receber:

- estado central;
- eventos;
- sessões;
- fila de ações;
- histórico local.

### Hermes

Deve receber:

- preparação de mensagens;
- gates de aprovação;
- readiness;
- compose assistido;
- trilho auditável por ação.

### Olympus

Deve receber:

- deliberação especializada;
- síntese coerente;
- leitura de risco;
- continuidade e memória;
- enquadramento de execução.

### Audit / Logs / Policies

Devem receber:

- eventos por ação;
- rastreabilidade por comando;
- classificação de risco;
- pontos de confirmação.

## O que realmente acrescenta para a excelência final

Se a pergunta for “o que acrescenta mesmo para a excelência final?”, a resposta é:

1. control plane;
2. runtime local robusto;
3. onboarding e doctor;
4. UI operacional rápida;
5. hooks e extensibilidade limpa;
6. canais adicionais só depois do núcleo estar sólido;
7. logs íntegros e gates claros.

## Decisão final

O ZEUS final de excelência deve ser:

- local-first;
- deliberativo mas prático;
- forte em runtime local;
- disciplinado em segurança e aprovação;
- rápido a operar;
- extensível sem perder clareza;
- auditável de ponta a ponta.
