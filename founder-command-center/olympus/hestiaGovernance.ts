import fs from "fs";
import path from "path";

const root = process.cwd();
const hestiaDir = path.join(root, "founder-command-center", "olympus", "hestia");
const decisionsDir = path.join(hestiaDir, "decisions");
const objectivesDir = path.join(hestiaDir, "objectives");
const blockersDir = path.join(hestiaDir, "blockers");
const governanceLog = path.join(hestiaDir, "governance-log.jsonl");

// ── Types ──

export type GovernanceIssueType =
  | "duplicate_decision"
  | "duplicate_objective"
  | "orphan_entity"
  | "stale_entity"
  | "semantic_drift"
  | "inconsistency"
  | "memory_bloat"
  | "loop_detected";

export type GovernanceIssue = {
  id: string;
  detectedAt: string;
  type: GovernanceIssueType;
  severity: "low" | "medium" | "high";
  description: string;
  entityIds: string[];
  suggestedAction: string;
  resolved: boolean;
};

export type GovernanceReport = {
  issues: GovernanceIssue[];
  stats: {
    totalEntities: number;
    totalDecisions: number;
    totalObjectives: number;
    duplicatesFound: number;
    staleEntities: number;
    orphansFound: number;
    memorySizeBytes: number;
  };
  healthScore: number;
};

// ── Helpers ──

function readJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch { return null; }
}

function readJsonLines(filePath: string): any[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    return fs.readFileSync(filePath, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map((line) => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean);
  } catch { return []; }
}

function appendLog(entry: any) {
  fs.mkdirSync(path.dirname(governanceLog), { recursive: true });
  fs.appendFileSync(governanceLog, JSON.stringify(entry) + "\n", "utf-8");
}

function dirSize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let size = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) size += dirSize(fullPath);
    else if (entry.isFile()) size += fs.statSync(fullPath).size;
  }
  return size;
}

function listFiles(dirPath: string, extension = ""): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((f) => (extension ? f.endsWith(extension) : true))
    .map((f) => path.join(dirPath, f));
}

// ── Duplicate Detection ──

function findDuplicateDecisions(): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  const files = listFiles(decisionsDir, ".json");

  // Group by normalized title
  const groups = new Map<string, string[]>();
  for (const filePath of files) {
    const dec = readJson(filePath);
    if (!dec?.title) continue;
    const key = dec.title.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(dec.id || filePath);
  }

  for (const [title, ids] of groups) {
    if (ids.length > 1) {
      issues.push({
        id: `gov-dup-dec-${Date.now()}-${ids.length}`,
        detectedAt: new Date().toISOString(),
        type: "duplicate_decision",
        severity: "high",
        description: `Duplicate decision found: "${title}" appears ${ids.length} times`,
        entityIds: ids,
        suggestedAction: `Merge decisions about "${title}" into one canonical record`,
        resolved: false
      });
      appendLog({ type: "duplicate_decision", title, ids, detectedAt: new Date().toISOString() });
    }
  }
  return issues;
}

function findDuplicateObjectives(): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  const files = listFiles(objectivesDir, ".json");

  const groups = new Map<string, string[]>();
  for (const filePath of files) {
    const obj = readJson(filePath);
    if (!obj?.title) continue;
    const key = obj.title.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(obj.id || filePath);
  }

  for (const [title, ids] of groups) {
    if (ids.length > 1) {
      issues.push({
        id: `gov-dup-obj-${Date.now()}-${ids.length}`,
        detectedAt: new Date().toISOString(),
        type: "duplicate_objective",
        severity: "high",
        description: `Duplicate objective: "${title}" appears ${ids.length} times`,
        entityIds: ids,
        suggestedAction: `Consolidate objectives about "${title}" into one`,
        resolved: false
      });
      appendLog({ type: "duplicate_objective", title, ids, detectedAt: new Date().toISOString() });
    }
  }
  return issues;
}

// ── Stale Entity Detection ──

function findStaleEntities(maxAgeDays = 7): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  const now = Date.now();
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

  for (const [dir, label] of [[decisionsDir, "decision"], [objectivesDir, "objective"], [blockersDir, "blocker"]] as const) {
    const files = listFiles(dir, ".json");
    for (const filePath of files) {
      const entity = readJson(filePath);
      if (!entity) continue;

      const entityTime = new Date(entity.updatedAt || entity.createdAt || 0).getTime();
      const age = now - entityTime;

      if (age > maxAge) {
        const isCompleted = entity.status === "completed" || entity.status === "abandoned" || entity.resolvedAt;
        if (!isCompleted) {
          issues.push({
            id: `gov-stale-${label}-${entity.id || Date.now()}`,
            detectedAt: new Date().toISOString(),
            type: "stale_entity",
            severity: "medium",
            description: `Stale ${label}: "${entity.title || entity.id}" untouched for ${Math.round(age / 86400000)} days`,
            entityIds: [entity.id || filePath],
            suggestedAction: `Review and either complete, update, or archive this ${label}`,
            resolved: false
          });
        }
      }
    }
  }
  return issues;
}

// ── Orphan Detection ──

function findOrphanEntities(): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  const decisionFiles = listFiles(decisionsDir, ".json");
  const objectiveFiles = listFiles(objectivesDir, ".json");

  // Check decision files for resolvable paths that don't exist
  for (const filePath of decisionFiles) {
    const dec = readJson(filePath);
    if (!dec?.relatedEntityIds) continue;
    for (const entityId of dec.relatedEntityIds) {
      const possiblePaths = [
        path.join(objectivesDir, `${entityId}.json`),
        path.join(objectivesDir, `${entityId.replace(/^obj-/, "")}.json`),
        path.join(blockersDir, `${entityId}.json`),
        path.join(blockersDir, `${entityId.replace(/^blk-/, "")}.json`),
        path.join(decisionsDir, `${entityId}.json`),
        path.join(decisionsDir, `${entityId.replace(/^dec-/, "")}.json`)
      ];
      const exists = possiblePaths.some((p) => fs.existsSync(p));
      if (!exists) {
        issues.push({
          id: `gov-orphan-${Date.now()}`,
          detectedAt: new Date().toISOString(),
          type: "orphan_entity",
          severity: "medium",
          description: `Decision "${dec.title}" references non-existent entity: ${entityId}`,
          entityIds: [dec.id || filePath, entityId],
          suggestedAction: `Update or remove the reference to ${entityId} from decision "${dec.title}"`,
          resolved: false
        });
      }
    }
  }

  // Check objectives without parent
  for (const filePath of objectiveFiles) {
    const obj = readJson(filePath);
    if (!obj?.parentObjectiveId) continue;
    const parentPath = path.join(objectivesDir, `${obj.parentObjectiveId}.json`);
    const altParentPath = path.join(objectivesDir, `${obj.parentObjectiveId.replace(/^obj-/, "")}.json`);
    if (!fs.existsSync(parentPath) && !fs.existsSync(altParentPath)) {
      issues.push({
        id: `gov-orphan-parent-${Date.now()}`,
        detectedAt: new Date().toISOString(),
        type: "orphan_entity",
        severity: "low",
        description: `Objective "${obj.title}" references non-existent parent: ${obj.parentObjectiveId}`,
        entityIds: [obj.id || filePath, obj.parentObjectiveId],
        suggestedAction: `Remove parent reference or create the parent objective`,
        resolved: false
      });
    }
  }

  return issues;
}

// ── Memory Bloat Detection ──

function checkMemoryBloat(): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  const size = dirSize(hestiaDir);
  const fileCount = listFiles(hestiaDir, ".json").length + listFiles(hestiaDir, ".jsonl").length;

  // Warn if Hestia directory exceeds 5MB
  if (size > 5 * 1024 * 1024) {
    issues.push({
      id: `gov-bloat-${Date.now()}`,
      detectedAt: new Date().toISOString(),
      type: "memory_bloat",
      severity: "medium",
      description: `Hestia memory directory size: ${(size / 1024 / 1024).toFixed(1)}MB (${fileCount} files)`,
      entityIds: [],
      suggestedAction: "Archive old decisions and objectives. Consider pruning entities older than 30 days.",
      resolved: false
    });
  }

  return issues;
}

// ── Loop Detection ──

function detectLoops(): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];

  // Check decision -> objective -> decision chains
  const decisionFiles = listFiles(decisionsDir, ".json");
  const objectiveFiles = listFiles(objectivesDir, ".json");

  const decIds = new Set(decisionFiles.map((f) => path.basename(f, ".json")));
  const objIds = new Set(objectiveFiles.map((f) => path.basename(f, ".json")));

  // Check for decisions that reference decisions that reference back
  for (const filePath of decisionFiles) {
    const dec = readJson(filePath);
    if (!dec?.relatedEntityIds) continue;

    for (const refId of dec.relatedEntityIds) {
      const refPath = [decisionsDir, objectivesDir]
        .map((d) => path.join(d, `${refId}.json`))
        .find((p) => fs.existsSync(p));
      if (!refPath || !refPath.includes("decisions")) continue;

      const refDec = readJson(refPath);
      if (refDec?.relatedEntityIds?.includes(dec.id || path.basename(filePath, ".json"))) {
        issues.push({
          id: `gov-loop-${Date.now()}`,
          detectedAt: new Date().toISOString(),
          type: "loop_detected",
          severity: "high",
          description: `Circular reference between decisions: "${dec.title}" <-> "${refDec.title}"`,
          entityIds: [dec.id || filePath, refDec.id || refPath],
          suggestedAction: "Break the circular reference. One decision should be canonical.",
          resolved: false
        });
      }
    }
  }

  return issues;
}

// ── Semantic Drift ──

function detectSemanticDrift(): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  // Check decisions made under similar context but with different conclusions
  const decisionFiles = listFiles(decisionsDir, ".json");
  const contextGroups = new Map<string, string[]>();

  for (const filePath of decisionFiles) {
    const dec = readJson(filePath);
    if (!dec?.context) continue;
    // Group by first 100 chars of context as a rough similarity heuristic
    const key = dec.context.toLowerCase().trim().slice(0, 100);
    if (!contextGroups.has(key)) contextGroups.set(key, []);
    contextGroups.get(key)!.push(dec.id || filePath);
  }

  // Find groups with different decisions
  for (const [contextPrefix, ids] of contextGroups) {
    if (ids.length < 2) continue;
    const decisions = ids
      .map((id) => {
        const paths = [decisionsDir, objectivesDir]
          .map((d) => path.join(d, `${id}.json`))
          .filter((p) => fs.existsSync(p));
        return paths.length > 0 ? readJson(paths[0]) : null;
      })
      .filter(Boolean);

    if (decisions.length < 2) continue;
    const uniqueDecisions = new Set(decisions.map((d: any) => d.decision?.toLowerCase().trim()));
    if (uniqueDecisions.size > 1) {
      issues.push({
        id: `gov-drift-${Date.now()}`,
        detectedAt: new Date().toISOString(),
        type: "semantic_drift",
        severity: "high",
        description: `Semantic drift detected: ${ids.length} decisions with similar context but different conclusions`,
        entityIds: ids,
        suggestedAction: "Review these decisions and reconcile any contradictions. One should be canonical.",
        resolved: false
      });
    }
  }

  return issues;
}

// ── Main Governance Check ──

export function runGovernanceCheck(): GovernanceReport {
  const issues: GovernanceIssue[] = [
    ...findDuplicateDecisions(),
    ...findDuplicateObjectives(),
    ...findStaleEntities(),
    ...findOrphanEntities(),
    ...checkMemoryBloat(),
    ...detectLoops(),
    ...detectSemanticDrift()
  ];

  const totalEntities =
    listFiles(decisionsDir, ".json").length +
    listFiles(objectivesDir, ".json").length +
    listFiles(blockersDir, ".json").length;

  const duplicatesFound = issues.filter((i) => i.type === "duplicate_decision" || i.type === "duplicate_objective").length;
  const staleEntities = issues.filter((i) => i.type === "stale_entity").length;
  const orphansFound = issues.filter((i) => i.type === "orphan_entity").length;
  const memorySizeBytes = dirSize(hestiaDir);

  // Health score: start at 100, deduct based on issues
  let healthScore = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case "high": healthScore -= 15; break;
      case "medium": healthScore -= 8; break;
      case "low": healthScore -= 3; break;
    }
  }
  healthScore = Math.max(0, Math.min(100, healthScore));

  const report: GovernanceReport = {
    issues,
    stats: {
      totalEntities,
      totalDecisions: listFiles(decisionsDir, ".json").length,
      totalObjectives: listFiles(objectivesDir, ".json").length,
      duplicatesFound,
      staleEntities,
      orphansFound,
      memorySizeBytes
    },
    healthScore
  };

  // Log governance report
  appendLog({
    type: "governance_check",
    detectedAt: new Date().toISOString(),
    issueCount: issues.length,
    healthScore
  });

  return report;
}

// ── Auto-cleanup: Resolve stale completed entities ──

export function autoCleanup(): { archived: number; errors: string[] } {
  const archived: string[] = [];
  const errors: string[] = [];

  // Archive objectives completed/abandoned for > 30 days
  const now = Date.now();
  const maxAge = 30 * 24 * 60 * 60 * 1000;

  for (const filePath of listFiles(objectivesDir, ".json")) {
    try {
      const obj = readJson(filePath);
      if (!obj) continue;
      const isTerminal = obj.status === "completed" || obj.status === "abandoned";
      const age = now - new Date(obj.updatedAt || obj.createdAt || 0).getTime();
      if (isTerminal && age > maxAge) {
        const archivePath = filePath.replace(".json", ".archived.json");
        fs.renameSync(filePath, archivePath);
        archived.push(obj.id || filePath);
      }
    } catch (e: any) {
      errors.push(`Failed to archive ${filePath}: ${e.message}`);
    }
  }

  // Archive resolved blockers > 14 days
  const blockerMaxAge = 14 * 24 * 60 * 60 * 1000;
  for (const filePath of listFiles(blockersDir, ".json")) {
    try {
      const blocker = readJson(filePath);
      if (!blocker?.resolvedAt) continue;
      const age = now - new Date(blocker.resolvedAt).getTime();
      if (age > blockerMaxAge) {
        const archivePath = filePath.replace(".json", ".archived.json");
        fs.renameSync(filePath, archivePath);
        archived.push(blocker.id || filePath);
      }
    } catch (e: any) {
      errors.push(`Failed to archive blocker ${filePath}: ${e.message}`);
    }
  }

  if (archived.length > 0) {
    appendLog({
      type: "auto_cleanup",
      detectedAt: new Date().toISOString(),
      archivedCount: archived.length,
      archived
    });
  }

  return { archived: archived.length, errors };
}

// ── Format ──

export function formatGovernanceReport(report: GovernanceReport): string {
  const severityLabels: Record<string, string> = {
    high: "🔴 HIGH",
    medium: "🟡 MEDIUM",
    low: "🟢 LOW"
  };

  const lines = [
    "═══ HESTIA MEMORY GOVERNANCE ═══",
    "",
    `Health Score: ${report.healthScore}/100`,
    `Issues detected: ${report.issues.length}`,
    "",
    "── Stats ──",
    `  Total entities: ${report.stats.totalEntities}`,
    `  Decisions: ${report.stats.totalDecisions}`,
    `  Objectives: ${report.stats.totalObjectives}`,
    `  Duplicates found: ${report.stats.duplicatesFound}`,
    `  Stale entities: ${report.stats.staleEntities}`,
    `  Orphans: ${report.stats.orphansFound}`,
    `  Memory size: ${(report.stats.memorySizeBytes / 1024).toFixed(1)}KB`,
    "",
    "── Issues ──",
  ];

  if (report.issues.length === 0) {
    lines.push("  ✅ No governance issues found.");
  } else {
    for (const issue of report.issues) {
      lines.push(`  ${severityLabels[issue.severity] || issue.severity}`);
      lines.push(`    ${issue.description}`);
      lines.push(`    Action: ${issue.suggestedAction}`);
      if (issue.entityIds.length > 0) {
        lines.push(`    Entities: ${issue.entityIds.slice(0, 3).join(", ")}${issue.entityIds.length > 3 ? "..." : ""}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}