export interface EntityRecord {
  id: string;
  type: "process" | "client" | "brain" | "category";
  canonical: string;
  aliases: string[];
}

export const entityRegistry: EntityRecord[] = [
  {
    id: "process_001",
    type: "process",
    canonical: "Moradia_Boavista",
    aliases: ["Moradia Boavista", "Boavista", "Processo Boavista"],
  },
  {
    id: "client_001",
    type: "client",
    canonical: "João_Silva",
    aliases: ["João Silva", "Sr. João", "Cliente João"],
  },
  {
    id: "brain_001",
    type: "brain",
    canonical: "ScopeGuard",
    aliases: ["Scope Guard", "Análise de Alterações"],
  },
  {
    id: "category_001",
    type: "category",
    canonical: "Alterações_Cliente",
    aliases: ["Alterações de Cliente", "Alteracoes Cliente", "Pedidos de alteração"],
  },
];

export function normalizeEntityName(input: string): string {
  const trimmed = input.trim();

  for (const entity of entityRegistry) {
    if (entity.canonical.toLowerCase() === trimmed.toLowerCase()) {
      return entity.canonical;
    }

    if (entity.aliases.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      return entity.canonical;
    }
  }

  return trimmed.replace(/\s+/g, "_");
}