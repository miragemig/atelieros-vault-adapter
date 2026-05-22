import fs from "fs";
import path from "path";

const root = process.cwd();

/**
 * Lightweight extraction of active olympus agent IDs from the agent registry.
 * Avoids a full module import to keep this script self-contained for tsx.
 */
function getActiveAgentIds(): string[] {
  try {
    const registryPath = path.join(
      root,
      "founder-command-center",
      "olympus",
      "agentRegistry.ts"
    );
    if (!fs.existsSync(registryPath)) return [];

    const content = fs.readFileSync(registryPath, "utf-8");
    // Match lines like: operationalStatus: "ACTIVE_NOW",
    // and capture the preceding id field value.
    const agentBlocks = content.split(/\n\s{2,}\w+:\s*\{/);
    const activeIds: string[] = [];

    // Simple pattern: look for id: "name" followed eventually by "ACTIVE_NOW"
    const idPattern = /id:\s*"(\w+)"/;
    const activePattern = /operationalStatus:\s*"ACTIVE_NOW"/;

    // Split by top-level agent entries
    const entries = content.split(/\n\s{2}\w+:\s*\{/);
    for (const entry of entries) {
      const idMatch = entry.match(idPattern);
      if (idMatch && activePattern.test(entry)) {
        activeIds.push(idMatch[1].toLowerCase());
      }
    }

    return activeIds;
  } catch {
    return [];
  }
}

// Cache active agent IDs at module load
const ACTIVE_AGENT_IDS: string[] = getActiveAgentIds();

const queueTemplatePath = path.join(
  root,
  "founder-command-center/build-system/roadmapQueue.json"
);

const queueStatePath = path.join(
  root,
  "founder-command-center/runtime/roadmapQueueState.json"
);

const buildTaskPath = path.join(
  root,
  "founder-command-center/runtime/buildTask.json"
);

// Domain keywords mapped from olympus capability map for task scoring
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  core: ["runtime", "build", "pipeline", "patch", "doctor", "status", "gateway"],
  olympus: ["olympus", "hera", "poseidon", "demeter", "athena", "apollo", "artemis",
    "ares", "aphrodite", "hephaestus", "hermes", "hestia", "zeus"],
  build: ["build", "candidate", "approval", "pipeline", "apply", "autonomous"],
  memory: ["memory", "context", "history", "entity", "obsidian", "sync", "notes"],
  governance: ["governance", "policy", "gate", "approval", "themis", "risk", "compliance"],
  intelligence: ["watch", "monitor", "intelligence", "external", "signal", "argus"],
  communication: ["email", "draft", "inbox", "hermes", "send", "compose", "message"],
  strategy: ["strategy", "priority", "decision", "athena", "trade-off", "criteria"],
  product: ["product", "ux", "ui", "design", "daedalus", "workflow", "system"],
  narrative: ["narrative", "content", "positioning", "apollo", "brand", "marketing"]
};

/**
 * Lightweight structural validation for roadmap queue files.
 * Returns true when the JSON has the expected { tasks: [...] } shape.
 * Does not validate every field — only what is needed to avoid a crash
 * on a corrupted or empty file.
 */
function isValidQueueShape(data: unknown): data is { tasks: unknown[] } {
  if (data === null || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.tasks)) return false;
  return true;
}

function readQueueSafely(filePath: string): { tasks: any[] } | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!isValidQueueShape(parsed)) {
      console.error(
        `Roadmap queue file ${filePath} has unexpected shape. Treating as empty.`
      );
      return null;
    }
    return parsed;
  } catch (err: any) {
    console.error(`Failed to read roadmap queue: ${err?.message || String(err)}`);
    return null;
  }
}

function ensureState() {
  fs.mkdirSync(path.dirname(queueStatePath), { recursive: true });

  if (!fs.existsSync(queueStatePath)) {
    fs.copyFileSync(queueTemplatePath, queueStatePath);
  }
}

/**
 * Count quarantine entries related to a task id to estimate failure history.
 */
function getTaskQuarantineCount(taskId: string): number {
  try {
    const quarantineDir = path.join(
      root,
      "founder-command-center",
      "build-system",
      "quarantine"
    );
    if (!fs.existsSync(quarantineDir)) return 0;

    return fs
      .readdirSync(quarantineDir)
      .filter((file) => file.includes(taskId))
      .length;
  } catch {
    return 0;
  }
}

/**
 * Compute domain match score based on how many domain keywords
 * are present in the task title and requirements.
 */
function computeDomainScore(task: any): number {
  const title = (task.title || "").toLowerCase();
  const requirements = (task.buildTask?.requirements || [])
    .join(" ")
    .toLowerCase();
  const searchText = `${title} ${requirements}`;

  let matches = 0;
  for (const keywords of Object.values(DOMAIN_KEYWORDS)) {
    for (const kw of keywords) {
      if (searchText.includes(kw)) {
        matches += 1;
      }
    }
  }

  // Cap domain score; having many keyword matches is good but we don't
  // want a scattered task to dominate over a strategically focused one.
  return Math.min(matches, 10);
}

/**
 * Count how many ACTIVE_NOW olympus agent IDs appear in the task text.
 * Tasks mentioning active agents get a relevance bonus.
 */
function computeActiveAgentBonus(task: any): number {
  if (ACTIVE_AGENT_IDS.length === 0) return 0;

  const title = (task.title || "").toLowerCase();
  const requirements = (task.buildTask?.requirements || [])
    .join(" ")
    .toLowerCase();
  const searchText = `${title} ${requirements}`;

  let hits = 0;
  for (const agentId of ACTIVE_AGENT_IDS) {
    if (searchText.includes(agentId)) {
      hits += 1;
    }
  }

  // Cap at 3 active agent mentions to avoid over-inflating
  return Math.min(hits, 3) * 25;
}

/**
 * Score a task for intelligent selection.
 *
 * Formula:
 *   baseScore = (maxPriorityWeight - taskPriority + 1) * 50
 *   domainScore = computeDomainScore(task) * 30
 *   activeAgentBonus = computeActiveAgentBonus(task)
 *   failurePenalty = Math.min(getTaskQuarantineCount(task.id), 5) * 20
 *   finalScore = baseScore + domainScore + activeAgentBonus - failurePenalty
 *
 * Lower priority number = higher urgency.
 * Tasks with many quarantine entries are penalised to avoid retrying
 * tasks that repeatedly fail.
 * Tasks mentioning ACTIVE_NOW agents receive a relevance bonus.
 */
function scoreTask(task: any): number {
  const MAX_PRIORITY = 10;
  const taskPriority = Math.min(task.priority || MAX_PRIORITY, MAX_PRIORITY);
  const priorityWeight = MAX_PRIORITY - taskPriority + 1; // priority 1 → weight 10

  const baseScore = priorityWeight * 50;
  const domainScore = computeDomainScore(task) * 30;
  const activeAgentBonus = computeActiveAgentBonus(task);
  const failureCount = getTaskQuarantineCount(task.id);
  const failurePenalty = Math.min(failureCount, 5) * 20;

  const finalScore = baseScore + domainScore + activeAgentBonus - failurePenalty;
  return finalScore;
}

function main() {
  ensureState();

  const queue = readQueueSafely(queueStatePath);
  if (!queue || !Array.isArray(queue.tasks)) {
    console.log("No valid roadmap queue — treating as empty.");
    process.exit(2);
  }

  const queuedTasks: any[] = queue.tasks.filter(
    (task: any) => task.status === "queued"
  );

  if (queuedTasks.length === 0) {
    console.log("No queued roadmap tasks.");
    process.exit(2);
  }

  // Score and sort all queued tasks
  const scored = queuedTasks.map((task: any) => ({
    task,
    score: scoreTask(task),
    domainMatches: computeDomainScore(task),
    quarantineCount: getTaskQuarantineCount(task.id)
  }));

  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 1) {
    console.log("Task selection scoring:");
    scored.forEach((entry, idx) => {
      console.log(
        `  ${idx + 1}. ${entry.task.id} — score=${entry.score} ` +
          `(priority=${entry.task.priority}, domain=${entry.domainMatches}, ` +
          `quarantine=${entry.quarantineCount})`
      );
    });
  }

  const nextTask = scored[0].task;

  nextTask.status = "in_progress";
  nextTask.startedAt = new Date().toISOString();

  fs.writeFileSync(
    buildTaskPath,
    JSON.stringify(nextTask.buildTask, null, 2),
    "utf-8"
  );
  fs.writeFileSync(queueStatePath, JSON.stringify(queue, null, 2), "utf-8");

  console.log(`Selected roadmap task: ${nextTask.id}`);
}

main();