import fs from "fs";
import path from "path";

const root = process.cwd();
const hestiaDir = path.join(root, "founder-command-center", "olympus", "hestia");
const memoryDir = path.join(hestiaDir, "memory");
const decisionsDir = path.join(hestiaDir, "decisions");
const objectivesDir = path.join(hestiaDir, "objectives");
const blockersDir = path.join(hestiaDir, "blockers");

// ── Types ────────────────────────────────────────────────

export type HestiaObjective = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  status: "active" | "completed" | "blocked" | "abandoned";
  priority: "critical" | "high" | "medium" | "low";
  parentObjectiveId?: string;
  tags: string[];
  notes: string[];
};

export type HestiaDecision = {
  id: string;
  createdAt: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  alternatives: string[];
  tags: string[];
  source: string;
  relatedEntityIds: string[];
};

export type HestiaBlocker = {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  severity: "blocking" | "warning" | "info";
  affectedAreas: string[];
  resolvedAt?: string;
  resolution?: string;
};

export type HestiaSessionState = {
  sessionId: string;
  startedAt: string;
  lastActivity: string;
  activeObjectives: string[];
  recentDecisions: string[];
  activeBlockers: string[];
  nextSteps: string[];
  currentFocus: string;
  summary: string;
};

export type HestiaCollectiveMemory = {
  objectives: HestiaObjective[];
  decisions: HestiaDecision[];
  blockers: HestiaBlocker[];
  sessions: HestiaSessionState[];
  timelineEvents: string[];
  entityLinks: number;
};

// ── Helpers ──────────────────────────────────────────────

function ensureDirectories() {
  for (const dir of [hestiaDir, memoryDir, decisionsDir, objectivesDir, blockersDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: any) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function timestamp(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function latestFiles(dirPath: string, extension = "", limit = 10): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((file) => (extension ? file.endsWith(extension) : true))
    .map((file) => ({
      file,
      fullPath: path.join(dirPath, file),
      time: fs.statSync(path.join(dirPath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time)
    .slice(0, limit)
    .map((item) => item.file);
}

// ── Objectives ───────────────────────────────────────────

export function createObjective(
  title: string,
  description: string,
  priority: HestiaObjective["priority"] = "medium",
  tags: string[] = [],
  parentObjectiveId?: string
): HestiaObjective {
  ensureDirectories();
  const obj: HestiaObjective = {
    id: id("obj"),
    createdAt: timestamp(),
    updatedAt: timestamp(),
    title,
    description,
    status: "active",
    priority,
    parentObjectiveId,
    tags,
    notes: []
  };
  writeJson(path.join(objectivesDir, `${obj.id}.json`), obj);
  return obj;
}

export function getObjective(id: string): HestiaObjective | null {
  return readJson(path.join(objectivesDir, `${id}.json`));
}

export function updateObjectiveStatus(
  id: string,
  status: HestiaObjective["status"],
  note?: string
): HestiaObjective | null {
  const obj = getObjective(id);
  if (!obj) return null;
  obj.status = status;
  obj.updatedAt = timestamp();
  if (note) obj.notes.push(`[${timestamp()}] ${note}`);
  writeJson(path.join(objectivesDir, `${id}.json`), obj);
  return obj;
}

export function listActiveObjectives(): HestiaObjective[] {
  ensureDirectories();
  if (!fs.existsSync(objectivesDir)) return [];
  const files = latestFiles(objectivesDir, ".json", 50);
  return files
    .map((f) => readJson(path.join(objectivesDir, f)))
    .filter((o): o is HestiaObjective => o !== null && o.status === "active")
    .sort((a, b) => {
      const prio = { critical: 0, high: 1, medium: 2, low: 3 };
      return (prio[a.priority] ?? 99) - (prio[b.priority] ?? 99);
    });
}

export function listAllObjectives(): HestiaObjective[] {
  ensureDirectories();
  if (!fs.existsSync(objectivesDir)) return [];
  const files = latestFiles(objectivesDir, ".json", 100);
  return files
    .map((f) => readJson(path.join(objectivesDir, f)))
    .filter((o): o is HestiaObjective => o !== null);
}

// ── Decisions ────────────────────────────────────────────

export function recordDecision(
  title: string,
  context: string,
  decision: string,
  rationale: string,
  alternatives: string[] = [],
  tags: string[] = [],
  source = "hestia",
  relatedEntityIds: string[] = []
): HestiaDecision {
  ensureDirectories();
  const dec: HestiaDecision = {
    id: id("dec"),
    createdAt: timestamp(),
    title,
    context,
    decision,
    rationale,
    alternatives,
    tags,
    source,
    relatedEntityIds
  };
  writeJson(path.join(decisionsDir, `${dec.id}.json`), dec);
  return dec;
}

export function getDecision(id: string): HestiaDecision | null {
  return readJson(path.join(decisionsDir, `${id}.json`));
}

export function listRecentDecisions(limit = 20): HestiaDecision[] {
  ensureDirectories();
  if (!fs.existsSync(decisionsDir)) return [];
  const files = latestFiles(decisionsDir, ".json", limit);
  return files
    .map((f) => readJson(path.join(decisionsDir, f)))
    .filter((d): d is HestiaDecision => d !== null);
}

export function searchDecisions(query: string): HestiaDecision[] {
  const all = listRecentDecisions(100);
  const q = query.toLowerCase();
  return all.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.context.toLowerCase().includes(q) ||
      d.decision.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q))
  );
}

// ── Blockers ─────────────────────────────────────────────

export function registerBlocker(
  title: string,
  description: string,
  severity: HestiaBlocker["severity"] = "warning",
  affectedAreas: string[] = []
): HestiaBlocker {
  ensureDirectories();
  const blocker: HestiaBlocker = {
    id: id("blk"),
    createdAt: timestamp(),
    title,
    description,
    severity,
    affectedAreas
  };
  writeJson(path.join(blockersDir, `${blocker.id}.json`), blocker);
  return blocker;
}

export function resolveBlocker(id: string, resolution: string): HestiaBlocker | null {
  const blocker = readJson(path.join(blockersDir, `${id}.json`));
  if (!blocker) return null;
  blocker.resolvedAt = timestamp();
  blocker.resolution = resolution;
  writeJson(path.join(blockersDir, `${id}.json`), blocker);
  return blocker;
}

export function listActiveBlockers(): HestiaBlocker[] {
  ensureDirectories();
  if (!fs.existsSync(blockersDir)) return [];
  const files = latestFiles(blockersDir, ".json", 50);
  return files
    .map((f) => readJson(path.join(blockersDir, f)))
    .filter((b): b is HestiaBlocker => b !== null && !b.resolvedAt)
    .sort((a, b) => {
      const sev = { blocking: 0, warning: 1, info: 2 };
      return (sev[a.severity] ?? 99) - (sev[b.severity] ?? 99);
    });
}

// ── Session State ────────────────────────────────────────

const SESSION_STATE_PATH = path.join(hestiaDir, "current-session.json");

export function getOrCreateSession(): HestiaSessionState {
  ensureDirectories();
  const existing = readJson(SESSION_STATE_PATH);
  if (existing) {
    existing.lastActivity = timestamp();
    writeJson(SESSION_STATE_PATH, existing);
    return existing;
  }
  const session: HestiaSessionState = {
    sessionId: id("ses"),
    startedAt: timestamp(),
    lastActivity: timestamp(),
    activeObjectives: [],
    recentDecisions: [],
    activeBlockers: [],
    nextSteps: [],
    currentFocus: "initialising",
    summary: "New Hestia session started."
  };
  writeJson(SESSION_STATE_PATH, session);
  return session;
}

export function updateSession(update: Partial<HestiaSessionState>): HestiaSessionState {
  const session = getOrCreateSession();
  Object.assign(session, update);
  session.lastActivity = timestamp();
  writeJson(SESSION_STATE_PATH, session);
  return session;
}

export function addNextStep(step: string): HestiaSessionState {
  const session = getOrCreateSession();
  session.nextSteps.push(step);
  session.lastActivity = timestamp();
  writeJson(SESSION_STATE_PATH, session);
  return session;
}

export function clearNextSteps(): HestiaSessionState {
  const session = getOrCreateSession();
  session.nextSteps = [];
  session.lastActivity = timestamp();
  writeJson(SESSION_STATE_PATH, session);
  return session;
}

// ── Collective Memory Report ─────────────────────────────

export function buildCollectiveMemory(): HestiaCollectiveMemory {
  const objectives = listAllObjectives();
  const decisions = listRecentDecisions(50);
  const blockers = listActiveBlockers();
  const session = getOrCreateSession();

  // Count entity links across all stored decisions
  const entityLinks = decisions.reduce((sum, d) => sum + d.relatedEntityIds.length, 0);

  return {
    objectives,
    decisions,
    blockers,
    sessions: [session],
    timelineEvents: [],
    entityLinks
  };
}

export function formatCollectiveMemorySummary(memory: HestiaCollectiveMemory): string {
  const activeObjectives = memory.objectives.filter((o) => o.status === "active");
  const blocking = memory.blockers.filter((b) => b.severity === "blocking");
  const warnings = memory.blockers.filter((b) => b.severity === "warning");
  const recentDecisions = memory.decisions.slice(0, 5);

  return [
    "═══ HESTIA MEMORY CORE ═══",
    "",
    `Session: ${memory.sessions[0]?.sessionId || "none"}`,
    `Started: ${memory.sessions[0]?.startedAt || "unknown"}`,
    `Current focus: ${memory.sessions[0]?.currentFocus || "none"}`,
    "",
    "── Active Objectives ──",
    ...(activeObjectives.length === 0
      ? ["  (none)"]
      : activeObjectives.map(
          (o) => `  [${o.priority.toUpperCase()}] ${o.title} — ${o.status}`
        )),
    "",
    "── Blockers ──",
    ...(memory.blockers.length === 0
      ? ["  (none)"]
      : [
          ...(blocking.length > 0
            ? ["  🔴 BLOCKING:"]
            : []),
          ...blocking.map((b) => `    ${b.title}: ${b.description}`),
          ...(warnings.length > 0
            ? ["  🟡 WARNINGS:"]
            : []),
          ...warnings.map((b) => `    ${b.title}: ${b.description}`)
        ]),
    "",
    "── Recent Decisions ──",
    ...(recentDecisions.length === 0
      ? ["  (none)"]
      : recentDecisions.map((d) => `  • ${d.title} (${d.createdAt.split("T")[0]})`)),
    "",
    `Entity links tracked: ${memory.entityLinks}`,
    `Total objectives: ${memory.objectives.length}`,
    `Total decisions: ${memory.decisions.length}`,
    `Next steps: ${memory.sessions[0]?.nextSteps?.length || 0}`,
    ""
  ].join("\n");
}