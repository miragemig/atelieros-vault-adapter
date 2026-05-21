type VisibleOlympusEntry = {
  id: string;
  name: string;
  title: string;
};

const INTERNAL_BY_CLASSICAL: Record<string, string[]> = {
  zeus: ["zeus"],
  hera: ["themis"],
  poseidon: ["poseidon"],
  demeter: ["plutus"],
  athena: ["athena"],
  apollo: ["apollo", "harmonia"],
  artemis: ["argus"],
  ares: ["ares"],
  aphrodite: ["aphrodite"],
  hephaestus: ["hephaestus", "daedalus", "prometheus"],
  hermes: ["hermes"],
  hestia: ["mnemosyne"]
};

const CLASSICAL_BY_INTERNAL: Record<string, VisibleOlympusEntry> = {
  zeus: {
    id: "zeus",
    name: "Zeus",
    title: "Juiz-orquestrador soberano"
  },
  themis: {
    id: "hera",
    name: "Hera",
    title: "Governação relacional e institucional"
  },
  mnemosyne: {
    id: "hestia",
    name: "Hestia",
    title: "Centro operacional, memória e continuidade"
  },
  harmonia: {
    id: "apollo",
    name: "Apollo",
    title: "Clareza, narrativa e expressão final"
  },
  argus: {
    id: "artemis",
    name: "Artemis",
    title: "Watch preciso e observação de sinais"
  },
  plutus: {
    id: "demeter",
    name: "Demeter",
    title: "Recursos, documentos e continuidade material"
  },
  prometheus: {
    id: "hephaestus",
    name: "Hephaestus",
    title: "Engenharia, build e sistemas futuros"
  },
  daedalus: {
    id: "hephaestus",
    name: "Hephaestus",
    title: "Engenharia, build e desenho de sistemas"
  },
  athena: {
    id: "athena",
    name: "Athena",
    title: "Estratégia, prioridades e critérios"
  },
  apollo: {
    id: "apollo",
    name: "Apollo",
    title: "Comunicação, narrativa e posicionamento"
  },
  ares: {
    id: "ares",
    name: "Ares",
    title: "Risco e contraditório"
  },
  hephaestus: {
    id: "hephaestus",
    name: "Hephaestus",
    title: "Build, engenharia e patches"
  },
  hermes: {
    id: "hermes",
    name: "Hermes",
    title: "Comunicação, inbox e drafts"
  },
  hera: {
    id: "hera",
    name: "Hera",
    title: "Governação relacional e institucional"
  },
  poseidon: {
    id: "poseidon",
    name: "Poseidon",
    title: "Browser, rede e superfícies externas"
  },
  demeter: {
    id: "demeter",
    name: "Demeter",
    title: "Recursos, documentos e continuidade material"
  },
  artemis: {
    id: "artemis",
    name: "Artemis",
    title: "Watch preciso e observação de sinais"
  },
  aphrodite: {
    id: "aphrodite",
    name: "Aphrodite",
    title: "Desejabilidade e ressonância humana"
  },
  hestia: {
    id: "hestia",
    name: "Hestia",
    title: "Centro operacional, memória e continuidade"
  }
};

export function mapInternalToClassicalOlympus(agentIds: string[]): VisibleOlympusEntry[] {
  const visible = agentIds
    .map((id) => CLASSICAL_BY_INTERNAL[id])
    .filter(Boolean);

  const unique = new Map<string, VisibleOlympusEntry>();
  for (const entry of visible) {
    if (!unique.has(entry.id)) {
      unique.set(entry.id, entry);
    }
  }

  return Array.from(unique.values());
}

export function resolveClassicalToInternalOlympus(agentIds: string[]): string[] {
  const resolved = agentIds.flatMap((id) => INTERNAL_BY_CLASSICAL[id] || []);
  return Array.from(new Set(resolved));
}
