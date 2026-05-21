export type ClassicalOlympianId =
  | "zeus"
  | "hera"
  | "poseidon"
  | "demeter"
  | "athena"
  | "apollo"
  | "artemis"
  | "ares"
  | "aphrodite"
  | "hephaestus"
  | "hermes"
  | "hestia";

export type ClassicalOlympianRole = {
  id: ClassicalOlympianId;
  name: string;
  function: string;
  operationalScope: string[];
  absorbs: string[];
};

export const CLASSICAL_OLYMPIANS: Record<ClassicalOlympianId, ClassicalOlympianRole> = {
  zeus: {
    id: "zeus",
    name: "Zeus",
    function:
      "Orquestração soberana, síntese, convocação dos outros deuses e recomendação final ao Miguel.",
    operationalScope: ["routing", "deliberação", "síntese", "recomendação", "pedido de aprovação"],
    absorbs: []
  },
  hera: {
    id: "hera",
    name: "Hera",
    function:
      "Governação relacional e institucional, compromissos, reputação, coerência externa e enquadramento de responsabilidade.",
    operationalScope: ["governance", "relações", "reputação", "compromissos", "ordem institucional"],
    absorbs: ["themis"]
  },
  poseidon: {
    id: "poseidon",
    name: "Poseidon",
    function:
      "Controlo de ambientes instáveis e superfícies externas: browser, rede e sistemas voláteis.",
    operationalScope: ["browser", "network", "external systems", "volatile environments"],
    absorbs: []
  },
  demeter: {
    id: "demeter",
    name: "Demeter",
    function:
      "Recursos, continuidade material, base documental, inventário operacional e sustentação do trabalho.",
    operationalScope: ["documents", "resources", "file continuity", "inventory", "operational cadence"],
    absorbs: ["plutus"]
  },
  athena: {
    id: "athena",
    name: "Athena",
    function:
      "Estratégia, critérios, prioridades, arquitetura de decisão e enquadramento racional.",
    operationalScope: ["strategy", "trade-offs", "decision criteria", "architecture", "prioritisation"],
    absorbs: ["daedalus", "prometheus", "themis"]
  },
  apollo: {
    id: "apollo",
    name: "Apollo",
    function:
      "Clareza, comunicação, narrativa, inteligibilidade e revisão final da expressão pública do sistema.",
    operationalScope: ["narrative", "communication", "clarity", "public expression", "final wording"],
    absorbs: ["harmonia"]
  },
  artemis: {
    id: "artemis",
    name: "Artemis",
    function:
      "Observação discreta, recolha seletiva de sinais, watch e rastreio com precisão.",
    operationalScope: ["watch", "monitoring", "signal collection", "pattern detection", "precision"],
    absorbs: ["argus"]
  },
  ares: {
    id: "ares",
    name: "Ares",
    function:
      "Contraditório, risco, pressão adversarial, cenários de falha e robustez sob conflito.",
    operationalScope: ["risk", "adversarial review", "failure modes", "security", "pressure tests"],
    absorbs: []
  },
  aphrodite: {
    id: "aphrodite",
    name: "Aphrodite",
    function:
      "Atração, desirability, primeira impressão, relação humana e apelo percebido da experiência.",
    operationalScope: ["ux desirability", "first impression", "client attraction", "human connection"],
    absorbs: []
  },
  hephaestus: {
    id: "hephaestus",
    name: "Hephaestus",
    function:
      "Engenharia, build, patches, implementação, automação e validação técnica.",
    operationalScope: ["build", "patches", "engineering", "automation", "validation"],
    absorbs: ["prometheus", "daedalus"]
  },
  hermes: {
    id: "hermes",
    name: "Hermes",
    function:
      "Transporte operacional de informação, emails, drafts, mensagens, triagem e handoff.",
    operationalScope: ["email", "drafts", "messages", "handoff", "communication workflows"],
    absorbs: []
  },
  hestia: {
    id: "hestia",
    name: "Hestia",
    function:
      "Centro estável do sistema, memória operacional, estado interno, continuidade e contexto persistente.",
    operationalScope: ["operational memory", "context", "state", "continuity", "system centre"],
    absorbs: ["mnemosyne"]
  }
};

export const EXTRA_GOD_ABSORPTION_MAP: Record<string, ClassicalOlympianId[]> = {
  themis: ["hera", "athena"],
  mnemosyne: ["hestia"],
  harmonia: ["apollo"],
  daedalus: ["athena", "hephaestus"],
  argus: ["artemis"],
  plutus: ["demeter", "athena"],
  prometheus: ["athena", "hephaestus"]
};

export const CANONICAL_OLYMPUS_MODEL = {
  canonicalCount: 12,
  hearthChoice: "hestia",
  rule:
    "No modelo canónico do ZEUS, só os 12 clássicos aparecem como deuses formais. Funções extra existem como subfunções internas absorvidas."
} as const;
