import fs from "fs";
import path from "path";

const root = process.cwd();
const HESTIA_DIR = path.join(root, "founder-command-center", "olympus", "hestia");
const TIERS_DIR = path.join(HESTIA_DIR, "tiers");
const HOT_DIR = path.join(TIERS_DIR, "hot");
const OPERATIONAL_DIR = path.join(TIERS_DIR, "operational");
const ARCHIVE_DIR = path.join(TIERS_DIR, "archive");
const IMMUTABLE_DIR = path.join(TIERS_DIR, "immutable");
const TIER_INDEX_PATH = path.join(TIERS_DIR, "tier-index.json");

// ── Types ──

export type MemoryTier = "hot" | "operational" | "archive" | "immutable";

export type TiertRecord = {
  id: string;
  filePath: string;
  tier: MemoryTier;
  promotedAt: string;
  lastAccessed: string;
  accessCount: number;
  sizeBytes: number;
  metadata: {
    type: "objective" | "decision" | "blocker" | "session" | "report" | "graph" | "canonical";
    title: string;
    tags: string[];
  };
};

export type TierIndex = {
  records: TiertRecord[];
  updatedAt: string;
  stats: {
    [K in MemoryTier]: { count: number; sizeBytes: number };
  };
};

// ── Init ──

function ensureDirs() {
  for (const dir of [TIERS_DIR, HOT_DIR, OPERATIONAL_DIR, ARCHIVE_DIR, IMMUTABLE_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readIndex(): TierIndex {
  ensureDirs();
  try {
    if (!fs.existsSync(TIER_INDEX_PATH)) {
      const empty: TierIndex = {
        records: [],
        updatedAt: new Date().toISOString(),
        stats: { hot: { count: 0, sizeBytes: 0 }, operational: { count: 0, sizeBytes: 0 }, archive: { count: 0, sizeBytes: 0 }, immutable: { count: 0, sizeBytes: 0 } }
      };
      fs.writeFileSync(TIER_INDEX_PATH, JSON.stringify(empty, null, 2), "utf-8");
      return empty;
    }
    return JSON.parse(fs.readFileSync(TIER_INDEX_PATH, "utf-8"));
  } catch { return { records: [], updatedAt: new Date().toISOString(), stats: { hot: { count: 0, sizeBytes: 0 }, operational: { count: 0, sizeBytes: 0 }, archive: { count: 0, sizeBytes: 0 }, immutable: { count: 0, sizeBytes: 0 } } }; }
}

function saveIndex(index: TierIndex) {
  ensureDirs();
  index.updatedAt = new Date().toISOString();
  // Recalculate stats
  const stats = { hot: { count: 0, sizeBytes: 0 }, operational: { count: 0, sizeBytes: 0 }, archive: { count: 0, sizeBytes: 0 }, immutable: { count: 0, sizeBytes: 0 } };
  for (const record of index.records) {
    stats[record.tier].count++;
    stats[record.tier].sizeBytes += record.sizeBytes;
  }
  index.stats = stats;
  fs.writeFileSync(TIER_INDEX_PATH, JSON.stringify(index, null, 2), "utf-8");
}

function fileSize(filePath: string): number {
  try { return fs.statSync(filePath).size; } catch { return 0; }
}

// ── Promote / Demote ──

export function promoteToTier(
  filePath: string,
  tier: MemoryTier,
  metadata: TiertRecord["metadata"]
): TiertRecord {
  const index = readIndex();
  const existing = index.records.find((r) => r.filePath === filePath);

  if (existing) {
    existing.tier = tier;
    existing.promotedAt = new Date().toISOString();
    existing.lastAccessed = new Date().toISOString();
    existing.accessCount++;
    existing.sizeBytes = fileSize(filePath);
    saveIndex(index);
    return existing;
  }

  const record: TiertRecord = {
    id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    filePath,
    tier,
    promotedAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    accessCount: 1,
    sizeBytes: fileSize(filePath),
    metadata
  };
  index.records.push(record);
  saveIndex(index);
  return record;
}

export function getTierStats(): TierIndex["stats"] {
  return readIndex().stats;
}

export function getTierContents(tier: MemoryTier): TiertRecord[] {
  const index = readIndex();
  return index.records.filter((r) => r.tier === tier).sort((a, b) => new Date(b.promotedAt).getTime() - new Date(a.promotedAt).getTime());
}

// ── Auto-tiering engine ──

export function autoTier(): { promoted: number; archived: number } {
  const index = readIndex();
  let promoted = 0;
  let archived = 0;

  for (const record of index.records) {
    const age = Date.now() - new Date(record.lastAccessed).getTime();
    const days = age / 86400000;

    // Auto-demote cold hot → operational
    if (record.tier === "hot" && days > 1 && record.accessCount < 3) {
      record.tier = "operational";
      record.promotedAt = new Date().toISOString();
      promoted++;
    }

    // Auto-archive old operational data
    if (record.tier === "operational" && days > 14 && record.accessCount < 2) {
      record.tier = "archive";
      record.promotedAt = new Date().toISOString();
      archived++;
    }
  }

  // Scan Hestia memory files and auto-register
  const scanDirs = [
    { dir: path.join(HESTIA_DIR, "objectives"), tier: "hot" as MemoryTier, type: "objective" as const },
    { dir: path.join(HESTIA_DIR, "decisions"), tier: "operational" as MemoryTier, type: "decision" as const },
    { dir: path.join(HESTIA_DIR, "blockers"), tier: "hot" as MemoryTier, type: "blocker" as const },
    { dir: path.join(HESTIA_DIR, "canonical"), tier: "operational" as MemoryTier, type: "canonical" as const }
  ];

  for (const { dir: scanDir, tier, type } of scanDirs) {
    if (!fs.existsSync(scanDir)) continue;
    for (const file of fs.readdirSync(scanDir)) {
      const fullPath = path.join(scanDir, file);
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) continue;
      if (index.records.some((r) => r.filePath === fullPath)) continue;
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const record: TiertRecord = {
          id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          filePath: fullPath,
          tier,
          promotedAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          accessCount: 1,
          sizeBytes: fileSize(fullPath),
          metadata: { type, title: content?.title || file, tags: content?.tags || [] }
        };
        index.records.push(record);
        promoted++;
      } catch {}
    }
  }

  saveIndex(index);
  return { promoted, archived };
}

export function formatTierSummary(): string {
  const stats = getTierStats();
  const lines = [
    "═══ MEMORY TIERS ═══",
    ""
  ];
  const tierLabels: Record<MemoryTier, string> = {
    hot: "🔥 HOT — Accessed frequently, must be fast",
    operational: "⚙️ OPERATIONAL — Recent context, warm",
    archive: "📦 ARCHIVE — Older data, rarely needed",
    immutable: "🔒 IMMUTABLE — Cannot be changed, audit trail"
  };

  for (const [tier, label] of Object.entries(tierLabels)) {
    const t = tier as MemoryTier;
    const s = stats[t];
    const sizeMB = (s.sizeBytes / (1024 * 1024)).toFixed(2);
    lines.push(`  ${label}`);
    lines.push(`    Files: ${s.count} | Size: ${sizeMB}MB`);
    lines.push("");
  }

  lines.push("── Hot Tier Contents ──");
  const hot = getTierContents("hot");
  if (hot.length === 0) lines.push("  (empty)");
  else for (const r of hot) lines.push(`  ${r.metadata.title} — accessed ${r.accessCount}x`);
  lines.push("");

  return lines.join("\n");
}

// ── Freeze to immutable ──

export function freezeToImmutable(filePath: string, metadata: TiertRecord["metadata"]): TiertRecord {
  const record = promoteToTier(filePath, "immutable", metadata);
  const immutablePath = path.join(IMMUTABLE_DIR, path.basename(filePath));
  try {
    fs.copyFileSync(filePath, immutablePath);
  } catch {}
  return record;
}