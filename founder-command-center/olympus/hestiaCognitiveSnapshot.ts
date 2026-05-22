import fs from "fs";
import path from "path";
import { buildCollectiveMemory, getOrCreateSession } from "./hestiaMemoryCore";
import { runGovernanceCheck } from "./hestiaGovernance";
import { buildTimelineIntelligence } from "./hestiaTimeline";
import { readGraph, getGraphStats } from "./hestiaEntityGraph";
import { getCanonicalStats } from "./hestiaCanonical";
import { getTierStats } from "./hestiaMemoryTiers";
import { readGatewayState, readRecentEvents } from "../zeus/zeusControlPlane";

const root = process.cwd();
const SNAPSHOTS_DIR = path.join(root, "founder-command-center", "olympus", "hestia", "snapshots");

// ── Types ──

export type CognitiveSnapshot = {
  id: string;
  capturedAt: string;
  label: string;
  
  // Who is ZEUS right now
  identity: OperationalIdentity;
  
  // What happened
  recentActivity: {
    last24hEvents: number;
    lastBuildStatus: string | null;
    lastModeChange: { from: string; to: string; at: string } | null;
  };
  
  // What is being worked on
  currentWork: {
    focus: string;
    activeObjectives: number;
    criticalBlockers: number;
    nextSteps: string[];
  };
  
  // Health
  health: {
    memoryScore: number;
    governanceIssues: number;
    degradationSignals: number;
    entityGraphNodes: number;
    entityGraphEdges: number;
  };
  
  // Growth indicators
  growth: {
    totalBuilds: number;
    totalDecisions: number;
    totalCanonical: number;
    memorySizeKB: number;
  };
};

export type OperationalIdentity = {
  status: "idle" | "deliberating" | "building" | "recovering" | "blocked";
  stability: "stable" | "unstable" | "degrading" | "unknown";
  confidence: number;  // 0-100
  maturityScore: number;  // 0-100 — how evolved the system is
  currentPhase: string;
  narrative: string;
};

// ── Compute Identity ──

function computeIdentity(): OperationalIdentity {
  const gateway = readGatewayState();
  const governance = runGovernanceCheck();
  const timeline = buildTimelineIntelligence();
  const session = getOrCreateSession();
  const memory = buildCollectiveMemory();

  // Status
  let status: OperationalIdentity["status"] = "idle";
  const hasCriticalDegradation = timeline.degradationTrend.some((d) => d.severity === "critical");
  const hasBlockingIssue = governance.issues.some((i) => i.severity === "high");
  const activeObjectivesCount = memory.objectives.filter((o) => o.status === "active").length;
  const isBuilding = timeline.changes24h.events.some((e) => e.category === "build");

  if (hasCriticalDegradation || hasBlockingIssue) {
    if (hasCriticalDegradation) status = "recovering";
    else status = "blocked";
  } else if (isBuilding) {
    status = "building";
  } else if (activeObjectivesCount > 0) {
    status = "deliberating";
  }

  // Stability
  let stability: OperationalIdentity["stability"] = "stable";
  if (hasCriticalDegradation) stability = "degrading";
  else if (governance.issues.filter((i) => i.severity === "high").length > 2) stability = "unstable";
  else if (governance.healthScore < 50) stability = "unstable";

  // Confidence (based on health, degradation, and recent pass rate)
  let confidence = governance.healthScore;
  if (timeline.degradationTrend.some((d) => d.severity === "critical")) confidence -= 20;
  if (timeline.changes24h.events.length === 0) confidence -= 5;
  // Add based on recent build pass rate
  const reports = Object.values(readGraph()?.nodes || {}).filter((n) => n.type === "build_report");
  const recentPasses = reports.filter((r) => r.metadata?.status === "pass").length;
  const recentTotal = reports.length || 1;
  confidence = Math.round(((confidence + (recentPasses / recentTotal) * 50) / 150) * 100);
  confidence = Math.max(0, Math.min(100, confidence));

  // Maturity score
  let maturityScore = 0;
  if (memory.objectives.length > 0) maturityScore += 10;
  if (memory.decisions.length > 0) maturityScore += 10;
  if (memory.blockers.length > 0) maturityScore += 5;
  if (getCanonicalStats().totalCanonical > 0) maturityScore += 15;
  if (getGraphStats()) maturityScore += 10;
  if (gateway?.controlPlane?.eventCount && gateway.controlPlane.eventCount > 50) maturityScore += 10;
  if (gateway?.mode === "SAFE_AUTONOMOUS_BUILD") maturityScore += 15;
  if (timeline.degradationTrend.length > 0) maturityScore += 5; // System can detect problems
  if (governance.issues.length > 0) maturityScore += 5; // Self-monitoring
  maturityScore += Math.min(15, (memory.objectives.length + memory.decisions.length) * 2);
  maturityScore = Math.min(100, maturityScore);

  // Current phase
  let currentPhase = "Initialisation";
  if (gateway) {
    if (maturityScore < 30) currentPhase = "Foundation — establishing core memory";
    else if (maturityScore < 50) currentPhase = "Growth — accumulating decisions and context";
    else if (maturityScore < 70) currentPhase = "Consolidation — linking entities and detecting patterns";
    else if (maturityScore < 90) currentPhase = "Autonomy — self-building with governance";
    else currentPhase = "Maturity — closed-loop evolution";
  }

  // Narrative
  const activeObj = memory.objectives.filter((o) => o.status === "active");
  const narrativeParts: string[] = [];
  narrativeParts.push(`ZEUS is currently ${status}.`);
  if (activeObj.length > 0) {
    narrativeParts.push(`Working on ${activeObj.length} objectives, highest priority: "${activeObj[0].title}".`);
  }
  if (hasCriticalDegradation) {
    narrativeParts.push("Build pipeline has critical degradation signals — recovery mode active.");
  }
  if (!hasCriticalDegradation && confidence > 70) {
    narrativeParts.push("System health is solid. Ready for autonomous cycles.");
  }
  if (gateway?.mode === "SAFE_AUTONOMOUS_BUILD") {
    narrativeParts.push("Operating in SAFE_AUTONOMOUS_BUILD mode — self-building within governance bounds.");
  } else {
    narrativeParts.push("Operating in DELIBERATION_ONLY mode — all actions require human review.");
  }
  narrativeParts.push(`Maturity: ${currentPhase}. Confidence: ${confidence}/100.`);

  return {
    status,
    stability,
    confidence,
    maturityScore,
    currentPhase,
    narrative: narrativeParts.join(" ")
  };
}

// ── Capture Snapshot ──

export function captureSnapshot(label = "auto"): CognitiveSnapshot {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });

  const identity = computeIdentity();
  const memory = buildCollectiveMemory();
  const governance = runGovernanceCheck();
  const timeline = buildTimelineIntelligence();
  const gateway = readGatewayState();
  const graph = readGraph();
  const canonicalStats = getCanonicalStats();
  const tierStats = getTierStats();
  const currentSession = getOrCreateSession();

  const events = readRecentEvents(500);
  const lastModeEvent = [...events].reverse().find((e) => e.type === "mode_changed");
  const lastModeChange = lastModeEvent ? {
    from: (lastModeEvent.data as any)?.previousMode || "unknown",
    to: (lastModeEvent.data as any)?.newMode || "unknown",
    at: lastModeEvent.at
  } : null;

  const totalBuilds = Object.values(graph?.nodes || {}).filter((n) => n.type === "build_report").length;
  const totalDecisions = memory.decisions.length;

  const snapshot: CognitiveSnapshot = {
    id: `snap-${Date.now()}`,
    capturedAt: new Date().toISOString(),
    label,
    identity,
    recentActivity: {
      last24hEvents: timeline.changes24h.eventCount,
      lastBuildStatus: gateway?.build?.latestReportStatus || null,
      lastModeChange
    },
    currentWork: {
      focus: currentSession?.currentFocus || "unknown",
      activeObjectives: memory.objectives.filter((o) => o.status === "active").length,
      criticalBlockers: memory.blockers.filter((b) => !b.resolvedAt && b.severity === "blocking").length,
      nextSteps: currentSession?.nextSteps || []
    },
    health: {
      memoryScore: governance.healthScore,
      governanceIssues: governance.issues.length,
      degradationSignals: timeline.degradationTrend.length,
      entityGraphNodes: Object.keys(graph?.nodes || {}).length,
      entityGraphEdges: graph?.edges?.length || 0
    },
    growth: {
      totalBuilds,
      totalDecisions,
      totalCanonical: canonicalStats.totalCanonical,
      memorySizeKB: Math.round((tierStats.hot.sizeBytes + tierStats.operational.sizeBytes) / 1024)
    }
  };

  const filePath = path.join(SNAPSHOTS_DIR, `snapshot-${snapshot.id}-${label.replace(/[^a-z0-9]/gi, "-")}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
  return snapshot;
}

// ── Get latest snapshot ──

export function getLatestSnapshot(): CognitiveSnapshot | null {
  if (!fs.existsSync(SNAPSHOTS_DIR)) return null;
  const files = fs.readdirSync(SNAPSHOTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();
  if (files.length === 0) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(SNAPSHOTS_DIR, files[0]), "utf-8"));
  } catch { return null; }
}

// ── Get identity (without creating a snapshot) ──

export function getIdentity(): OperationalIdentity {
  return computeIdentity();
}

// ── Format ──

export function formatIdentity(identity: OperationalIdentity): string {
  const statusIcons: Record<string, string> = {
    idle: "💤", deliberating: "🤔", building: "🏗️", recovering: "🔧", blocked: "🚫"
  };
  const stabilityIcons: Record<string, string> = {
    stable: "✅", unstable: "⚠️", degrading: "🔻", unknown: "❓"
  };

  return [
    "═══ ZEUS OPERATIONAL IDENTITY ═══",
    "",
    `${statusIcons[identity.status] || "❓"} Status: ${identity.status.toUpperCase()}`,
    `${stabilityIcons[identity.stability] || "❓"} Stability: ${identity.stability}`,
    `🎯 Confidence: ${identity.confidence}/100`,
    `📈 Maturity: ${identity.maturityScore}/100`,
    `📋 Phase: ${identity.currentPhase}`,
    "",
    "── Narrative ──",
    `  ${identity.narrative}`,
    ""
  ].join("\n");
}

export function formatSnapshot(snapshot: CognitiveSnapshot): string {
  const statusIcons: Record<string, string> = {
    idle: "💤", deliberating: "🤔", building: "🏗️", recovering: "🔧", blocked: "🚫"
  };

  return [
    "╔══════════════════════════════════════════════════════════╗",
    `║  COGNITIVE SNAPSHOT — ${snapshot.label}                 `,
    "╚══════════════════════════════════════════════════════════╝",
    "",
    `Captured at: ${snapshot.capturedAt}`,
    `Snapshot ID: ${snapshot.id}`,
    "",
    "── Identity ──",
    `  ${statusIcons[snapshot.identity.status] || "❓"} ${snapshot.identity.status.toUpperCase()}`,
    `  Stability: ${snapshot.identity.stability}`,
    `  Confidence: ${snapshot.identity.confidence}/100`,
    `  Maturity: ${snapshot.identity.maturityScore}/100`,
    `  Phase: ${snapshot.identity.currentPhase}`,
    `  ${snapshot.identity.narrative}`,
    "",
    "── Activity ──",
    `  24h events: ${snapshot.recentActivity.last24hEvents}`,
    `  Last build: ${snapshot.recentActivity.lastBuildStatus || "none"}`,
    snapshot.recentActivity.lastModeChange
      ? `  Last mode: ${snapshot.recentActivity.lastModeChange.from} → ${snapshot.recentActivity.lastModeChange.to}`
      : "  No mode changes recorded",
    "",
    "── Current Work ──",
    `  Focus: ${snapshot.currentWork.focus}`,
    `  Active objectives: ${snapshot.currentWork.activeObjectives}`,
    `  Critical blockers: ${snapshot.currentWork.criticalBlockers}`,
    `  Next steps: ${snapshot.currentWork.nextSteps.length > 0 ? snapshot.currentWork.nextSteps.join(", ") : "none"}`,
    "",
    "── Health ──",
    `  Memory score: ${snapshot.health.memoryScore}/100`,
    `  Governance issues: ${snapshot.health.governanceIssues}`,
    `  Degradation signals: ${snapshot.health.degradationSignals}`,
    `  Graph: ${snapshot.health.entityGraphNodes} nodes, ${snapshot.health.entityGraphEdges} edges`,
    "",
    "── Growth ──",
    `  Total builds: ${snapshot.growth.totalBuilds}`,
    `  Total decisions: ${snapshot.growth.totalDecisions}`,
    `  Canonical entities: ${snapshot.growth.totalCanonical}`,
    `  Memory size: ${snapshot.growth.memorySizeKB}KB`,
    ""
  ].join("\n");
}