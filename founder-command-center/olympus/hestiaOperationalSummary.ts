import {
  buildCollectiveMemory,
  formatCollectiveMemorySummary,
  HestiaCollectiveMemory
} from "./hestiaMemoryCore";
import { runGovernanceCheck, formatGovernanceReport, GovernanceReport } from "./hestiaGovernance";
import {
  buildTimelineIntelligence,
  formatTimelineIntelligence,
  TimelineIntelligence
} from "./hestiaTimeline";
import { scanEntityGraph, printGraphSummary } from "./hestiaEntityGraph";
import { readGatewayState } from "../zeus/zeusControlPlane";
import { readOperationalContext } from "../chat/zeusOperationalContext";

// ── Types ──

export type HestiaOperationalSummary = {
  generatedAt: string;
  mode: "MORNING_SYNTHESIS" | "ON_DEMAND" | "CYCLE_CHECKPOINT";
  memory: HestiaCollectiveMemory;
  governance: GovernanceReport;
  timeline: TimelineIntelligence;
  entityGraphStats: {
    totalNodes: number;
    totalEdges: number;
  };
  synthesis: string;
  recommendations: Array<{
    priority: "critical" | "high" | "medium" | "low";
    action: string;
    reasoning: string;
  }>;
  nextRecommendedFocus: string;
};

// ── Synthesis Engine ──

function generateSynthesis(
  memory: HestiaCollectiveMemory,
  governance: GovernanceReport,
  timeline: TimelineIntelligence
): string {
  const parts: string[] = [];

  // 1. Overall system pulse
  const activeObjectives = memory.objectives.filter((o) => o.status === "active").length;
  const blockingIssues = governance.issues.filter((i) => i.severity === "high").length;
  const totalIssues = governance.issues.length;
  const criticalDegradations = timeline.degradationTrend.filter((d) => d.severity === "critical").length;

  parts.push(`System pulse: ${activeObjectives} active objectives, ${governance.healthScore}/100 memory health, ${blockingIssues} blocking issues.`);

  // 2. Memory health narrative
  if (governance.healthScore >= 80) {
    parts.push("Memory is healthy — no urgent deduplication or cleanup needed.");
  } else if (governance.healthScore >= 50) {
    const topIssues = governance.issues.slice(0, 3).map((i) => i.description.toLowerCase());
    parts.push(`Memory needs attention: ${topIssues.join("; ")}.`);
  } else {
    parts.push(`⚠️ Memory health is critical (${governance.healthScore}/100). ${governance.issues.length} issues require immediate review.`);
  }

  // 3. Build narrative
  const buildCount = timeline.keyMilestones.filter((m) => m.includes("builds")).length;
  const passCount = timeline.degradationTrend.filter((d) => d.severity !== "critical").length;
  if (criticalDegradations > 0) {
    parts.push(`⚠️ Build pipeline has ${criticalDegradations} degradation signal(s) — review required before next cycle.`);
  } else if (timeline.changes24h.events.some((e) => e.category === "build")) {
    parts.push("Build pipeline stable in last 24h — no critical degradation.");
  } else {
    parts.push("No build activity in the last 24h.");
  }

  // 4. Timeline narrative
  const last24h = timeline.changes24h.eventCount;
  if (last24h > 0) {
    const byCategory = new Map<string, number>();
    for (const e of timeline.changes24h.events) {
      byCategory.set(e.category, (byCategory.get(e.category) || 0) + 1);
    }
    const breakdown = [...byCategory.entries()].map(([cat, count]) => `${count} ${cat}`).join(", ");
    parts.push(`Activity in last 24h: ${last24h} events (${breakdown}).`);
  } else {
    parts.push("No significant activity detected in the last 24h.");
  }

  // 5. Entity graph narrative
  if (memory.entityLinks > 0) {
    parts.push(`Entity graph tracks ${memory.entityLinks} decision links across ${memory.decisions.length} decisions.`);
  } else {
    parts.push("Entity graph seeded but not yet enriched with cross-references.");
  }

  // 6. Blockers narrative
  const activeBlockers = memory.blockers.filter((b) => !b.resolvedAt);
  if (activeBlockers.length > 0) {
    const blocking = activeBlockers.filter((b) => b.severity === "blocking");
    if (blocking.length > 0) {
      parts.push(`🚫 ${blocking.length} active blocking issue(s) preventing progress.`);
    } else {
      parts.push(`${activeBlockers.length} active warning(s) — manageable but should be reviewed.`);
    }
  }

  // 7. Autonomy narrative
  const modeChanges = timeline.modeActivationHistory;
  if (modeChanges.length > 0) {
    const lastMode = modeChanges[0];
    parts.push(`Last mode change: ${lastMode.from} → ${lastMode.to} (${lastMode.at.slice(0, 16)}).`);
  } else {
    parts.push("No mode changes recorded — system likely in DELIBERATION_ONLY.");
  }

  return parts.join("\n");
}

// ── Recommendations Engine ──

function generateRecommendations(
  memory: HestiaCollectiveMemory,
  governance: GovernanceReport,
  timeline: TimelineIntelligence
): HestiaOperationalSummary["recommendations"] {
  const recommendations: HestiaOperationalSummary["recommendations"] = [];

  // 1. Governance issues first
  const highIssues = governance.issues.filter((i) => i.severity === "high");
  for (const issue of highIssues.slice(0, 3)) {
    recommendations.push({
      priority: "critical",
      action: issue.suggestedAction,
      reasoning: issue.description
    });
  }

  // 2. Build degradation
  const criticalDeg = timeline.degradationTrend.filter((d) => d.severity === "critical");
  for (const deg of criticalDeg.slice(0, 2)) {
    recommendations.push({
      priority: "critical",
      action: `Investigate build degradation: ${deg.symptom}`,
      reasoning: `Build ${deg.buildId} failed after previous success. Check logs and repair pipeline.`
    });
  }

  // 3. Stale objectives
  const stalledObjectives = memory.objectives.filter(
    (o) => o.status === "active" && !o.updatedAt
  ).length === 0 ? [] : memory.objectives.filter((o) => {
    const age = Date.now() - new Date(o.updatedAt || o.createdAt).getTime();
    return o.status === "active" && age > 7 * 86400000;
  });
  for (const obj of stalledObjectives.slice(0, 2)) {
    recommendations.push({
      priority: "medium",
      action: `Review stalled objective: "${obj.title}"`,
      reasoning: `No updates for ${Math.round((Date.now() - new Date(obj.updatedAt || obj.createdAt).getTime()) / 86400000)} days. Either complete or reprioritize.`
    });
  }

  // 4. Next cycle readiness
  const session = memory.sessions[0];
  if (session && session.nextSteps.length > 0) {
    recommendations.push({
      priority: "high",
      action: session.nextSteps[0],
      reasoning: `From session context: "${session.summary}". This is the first queued next step.`
    });
  }

  // 5. Morning report if none exists
  if (timeline.changes24h.eventCount > 0 && timeline.changes24h.events.filter((e) => e.category === "report").length === 0) {
    recommendations.push({
      priority: "medium",
      action: "Generate morning report for the last 24h activity",
      reasoning: "Significant activity detected but no morning report was generated. Cognitive synthesis is due."
    });
  }

  // 6. Cleanup if bloat detected
  const bloatIssue = governance.issues.find((i) => i.type === "memory_bloat");
  if (bloatIssue) {
    recommendations.push({
      priority: "low",
      action: bloatIssue.suggestedAction,
      reasoning: bloatIssue.description
    });
  }

  return recommendations;
}

// ── Determine Next Focus ──

function determineNextFocus(
  memory: HestiaCollectiveMemory,
  recommendations: HestiaOperationalSummary["recommendations"]
): string {
  // If there are critical recommendations, focus on those
  const critical = recommendations.filter((r) => r.priority === "critical");
  if (critical.length > 0) {
    return `Resolve: ${critical[0].action}`;
  }

  // If there are active objectives, focus on the highest priority
  const activeObjectives = memory.objectives.filter((o) => o.status === "active");
  if (activeObjectives.length > 0) {
    const sorted = activeObjectives.sort((a, b) => {
      const prio = { critical: 0, high: 1, medium: 2, low: 3 };
      return (prio[a.priority] ?? 99) - (prio[b.priority] ?? 99);
    });
    return `Continue: ${sorted[0].title}`;
  }

  // If there are high recommendations
  const high = recommendations.filter((r) => r.priority === "high");
  if (high.length > 0) {
    return `Address: ${high[0].action}`;
  }

  return "Idle — evaluate next set of objectives or create new ones.";
}

// ── Main Builder ──

export function buildOperationalSummary(mode: HestiaOperationalSummary["mode"] = "ON_DEMAND"): HestiaOperationalSummary {
  const memory = buildCollectiveMemory();
  const governance = runGovernanceCheck();
  const timeline = buildTimelineIntelligence();
  const entityGraph = scanEntityGraph();

  const synthesis = generateSynthesis(memory, governance, timeline);
  const recommendations = generateRecommendations(memory, governance, timeline);
  const nextRecommendedFocus = determineNextFocus(memory, recommendations);

  return {
    generatedAt: new Date().toISOString(),
    mode,
    memory,
    governance,
    timeline,
    entityGraphStats: {
      totalNodes: Object.keys(entityGraph.nodes).length,
      totalEdges: entityGraph.edges.length
    },
    synthesis,
    recommendations,
    nextRecommendedFocus
  };
}

// ── Format ──

export function formatOperationalSummary(summary: HestiaOperationalSummary): string {
  const lines = [
    "╔══════════════════════════════════════════════════════════╗",
    "║            HESTIA OPERATIONAL SUMMARY                    ║",
    "╚══════════════════════════════════════════════════════════╝",
    "",
    `Generated: ${summary.generatedAt}`,
    `Mode: ${summary.mode}`,
    `Memory health: ${summary.governance.healthScore}/100`,
    `Entity graph: ${summary.entityGraphStats.totalNodes} nodes, ${summary.entityGraphStats.totalEdges} edges`,
    "",
    "── Cognitive Synthesis ──",
    "",
    "  " + summary.synthesis.replace(/\n/g, "\n  "),
    "",
    "── Recommendations (by priority) ──",
    "",
  ];

  const priorityLabels: Record<string, string> = {
    critical: "🔴 CRITICAL",
    high: "🟡 HIGH",
    medium: "🟢 MEDIUM",
    low: "⚪ LOW"
  };

  if (summary.recommendations.length === 0) {
    lines.push("  ✅ No recommendations. System is in good shape.");
  } else {
    for (const rec of summary.recommendations) {
      lines.push(`  ${priorityLabels[rec.priority] || rec.priority}`);
      lines.push(`    Action: ${rec.action}`);
      lines.push(`    Why: ${rec.reasoning}`);
      lines.push("");
    }
  }

  lines.push(`── Next Recommended Focus ──`);
  lines.push("");
  lines.push(`  ${summary.nextRecommendedFocus}`);
  lines.push("");

  return lines.join("\n");
}

// ── Action: Quick summary for CLI output ──

export function quickSummary(): string {
  const summary = buildOperationalSummary("ON_DEMAND");
  return [
    "═══ HESTIA QUICK SUMMARY ═══",
    `Health: ${summary.governance.healthScore}/100 | Objectives: ${summary.memory.objectives.filter((o) => o.status === "active").length} active`,
    `Blockers: ${summary.memory.blockers.filter((b) => !b.resolvedAt && b.severity === "blocking").length} blocking, ${summary.memory.blockers.filter((b) => !b.resolvedAt && b.severity === "warning").length} warnings`,
    `24h events: ${summary.timeline.changes24h.eventCount} | Degradations: ${summary.timeline.degradationTrend.length}`,
    `Focus: ${summary.nextRecommendedFocus}`,
    ""
  ].join("\n");
}