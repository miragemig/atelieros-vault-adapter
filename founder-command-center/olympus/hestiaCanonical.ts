import fs from "fs";
import path from "path";

const root = process.cwd();
const CANONICAL_DIR = path.join(root, "founder-command-center", "olympus", "hestia", "canonical");
const REGISTRY_PATH = path.join(CANONICAL_DIR, "entity-registry.json");

// ── Types ──

export type CanonicalEntity = {
  canonicalId: string;
  canonicalName: string;
  entityType: "task" | "feature" | "module" | "system" | "component" | "provider" | "agent";
  aliases: string[];
  createdAt: string;
  updatedAt: string;
  linkedEntityIds: string[];
  tags: string[];
  description: string;
  status: "active" | "deprecated" | "merged";
  mergedInto?: string;
};

export type EntityRegistry = {
  entities: CanonicalEntity[];
  aliasIndex: Record<string, string>; // alias → canonicalId
  updatedAt: string;
};

// ── Load / Save Registry ──

function ensureDir() { fs.mkdirSync(CANONICAL_DIR, { recursive: true }); }

function readRegistry(): EntityRegistry {
  ensureDir();
  try {
    if (!fs.existsSync(REGISTRY_PATH)) {
      const empty: EntityRegistry = { entities: [], aliasIndex: {}, updatedAt: new Date().toISOString() };
      fs.writeFileSync(REGISTRY_PATH, JSON.stringify(empty, null, 2), "utf-8");
      return empty;
    }
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  } catch { return { entities: [], aliasIndex: {}, updatedAt: new Date().toISOString() }; }
}

function saveRegistry(registry: EntityRegistry) {
  ensureDir();
  registry.updatedAt = new Date().toISOString();
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");
}

function rebuildAliasIndex(registry: EntityRegistry): Record<string, string> {
  const index: Record<string, string> = {};
  for (const entity of registry.entities) {
    index[entity.canonicalName.toLowerCase()] = entity.canonicalId;
    for (const alias of entity.aliases) {
      index[alias.toLowerCase()] = entity.canonicalId;
    }
  }
  return index;
}

// ── Name Normalization ──

function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[-_./]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/module|system|component|feature|task/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function generateAliases(raw: string): string[] {
  const aliases: string[] = [];
  const base = raw.trim();

  aliases.push(base);
  aliases.push(base.toLowerCase());
  aliases.push(base.replace(/[-_ ]/g, "-").toLowerCase());
  aliases.push(base.replace(/[-_ ]/g, "_").toLowerCase());
  aliases.push(base.replace(/[-_ ]/g, "").toLowerCase());

  // CamelCase variants
  const words = base.split(/[-_ ]+/);
  if (words.length > 1) {
    aliases.push(words.map((w, i) => i === 0 ? w.toLowerCase() : w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(""));
    aliases.push(words.map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(""));
    aliases.push(words.join("_").toLowerCase());
    aliases.push(words.join("-").toLowerCase());
  }

  return [...new Set(aliases.map((a) => a.trim()).filter(Boolean))];
}

// ── Core Operations ──

export function registerCanonical(
  name: string,
  entityType: CanonicalEntity["entityType"] = "feature",
  tags: string[] = [],
  description = ""
): CanonicalEntity {
  const registry = readRegistry();
  const normalized = normalizeName(name);

  // Check if already exists
  const existingId = registry.aliasIndex[normalized];
  if (existingId) {
    const existing = registry.entities.find((e) => e.canonicalId === existingId);
    if (existing) return existing;
  }

  const aliases = generateAliases(name);
  const entity: CanonicalEntity = {
    canonicalId: `canon-${normalized}`,
    canonicalName: name,
    entityType,
    aliases,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedEntityIds: [],
    tags,
    description,
    status: "active"
  };

  registry.entities.push(entity);
  registry.aliasIndex = rebuildAliasIndex(registry);
  saveRegistry(registry);
  return entity;
}

export function resolveToCanonical(name: string): CanonicalEntity | null {
  const registry = readRegistry();
  const normalized = normalizeName(name);

  // Direct lookup
  const id = registry.aliasIndex[normalized];
  if (id) return registry.entities.find((e) => e.canonicalId === id) || null;

  // Fuzzy: check if any alias is contained in the name
  for (const [alias, canonicalId] of Object.entries(registry.aliasIndex)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return registry.entities.find((e) => e.canonicalId === canonicalId) || null;
    }
  }

  return null;
}

export function searchCanonical(query: string): CanonicalEntity[] {
  const registry = readRegistry();
  const q = query.toLowerCase();
  return registry.entities.filter(
    (e) =>
      e.canonicalName.toLowerCase().includes(q) ||
      e.aliases.some((a) => a.toLowerCase().includes(q)) ||
      e.tags.some((t) => t.toLowerCase().includes(q)) ||
      e.description.toLowerCase().includes(q)
  );
}

export function linkEntityToCanonical(canonicalId: string, entityId: string): CanonicalEntity | null {
  const registry = readRegistry();
  const entity = registry.entities.find((e) => e.canonicalId === canonicalId);
  if (!entity) return null;
  if (!entity.linkedEntityIds.includes(entityId)) {
    entity.linkedEntityIds.push(entityId);
    entity.updatedAt = new Date().toISOString();
    saveRegistry(registry);
  }
  return entity;
}

export function mergeCanonical(sourceId: string, targetId: string): CanonicalEntity | null {
  const registry = readRegistry();
  const source = registry.entities.find((e) => e.canonicalId === sourceId);
  const target = registry.entities.find((e) => e.canonicalId === targetId);
  if (!source || !target) return null;

  // Merge aliases
  for (const alias of source.aliases) {
    if (!target.aliases.includes(alias)) target.aliases.push(alias);
  }
  // Merge linked entities
  for (const link of source.linkedEntityIds) {
    if (!target.linkedEntityIds.includes(link)) target.linkedEntityIds.push(link);
  }
  // Merge tags
  for (const tag of source.tags) {
    if (!target.tags.includes(tag)) target.tags.push(tag);
  }

  source.status = "merged";
  source.mergedInto = targetId;
  target.updatedAt = new Date().toISOString();

  registry.aliasIndex = rebuildAliasIndex(registry);
  saveRegistry(registry);
  return target;
}

export function listCanonicalByType(type: CanonicalEntity["entityType"]): CanonicalEntity[] {
  const registry = readRegistry();
  return registry.entities.filter((e) => e.entityType === type && e.status === "active");
}

export function getCanonicalStats() {
  const registry = readRegistry();
  const active = registry.entities.filter((e) => e.status === "active");
  const merged = registry.entities.filter((e) => e.status === "merged");
  const byType: Record<string, number> = {};
  for (const e of active) {
    byType[e.entityType] = (byType[e.entityType] || 0) + 1;
  }
  const totalLinks = active.reduce((sum, e) => sum + e.linkedEntityIds.length, 0);

  return {
    totalCanonical: registry.entities.length,
    active,
    merged,
    byType,
    totalAliases: Object.keys(registry.aliasIndex).length,
    totalLinks
  };
}

export function printCanonicalSummary(): string {
  const stats = getCanonicalStats();
  const lines = [
    "═══ CANONICAL ENTITY REGISTRY ═══",
    `Total canonical entities: ${stats.totalCanonical}`,
    `Active: ${stats.active.length} | Merged: ${stats.merged.length}`,
    `Aliases indexed: ${stats.totalAliases}`,
    `Entity links: ${stats.totalLinks}`,
    "",
    "── By type ──"
  ];
  for (const [type, count] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${type}: ${count}`);
  }
  lines.push("");
  lines.push("── Active entities ──");
  for (const entity of stats.active) {
    lines.push(`  ${entity.canonicalName} [${entity.entityType}] — ${entity.linkedEntityIds.length} links`);
  }
  return lines.join("\n");
}

// ── Auto-discover from graph ──

export function autoDiscoverFromGraph(graphLabels: string[]): CanonicalEntity[] {
  const created: CanonicalEntity[] = [];
  for (const label of graphLabels) {
    const resolved = resolveToCanonical(label);
    if (!resolved) {
      const entity = registerCanonical(label, "task", ["auto-discovered"]);
      created.push(entity);
    }
  }
  return created;
}