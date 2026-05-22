import fs from "fs";
import path from "path";
import { getLatestSnapshot, getIdentity, OperationalIdentity } from "./hestiaCognitiveSnapshot";
import {
  listActiveObjectives, listRecentDecisions, listActiveBlockers,
  HestiaObjective, HestiaDecision, HestiaBlocker
} from "./hestiaMemoryCore";
import { buildTimelineIntelligence, TimelineIntelligence } from "./hestiaTimeline";
import { readGraph } from "./hestiaEntityGraph";
import { getCanonicalStats } from "./hestiaCanonical";

const root = process.cwd();

export type AthenaStrategicDirection = {
  generatedAt: string;
  systemState: {
    identity: OperationalIdentity;
    activeObjectives: number;
    pendingDecisions: number;
    activeBlockers: number;
    degradationSignals: number;
    buildPassRate: number;
  };
  strategicFocus: string;
  priorityOrder: string[];
  whatToAvoid: string[];
  why: string;
  evidence: string[];
  recommendedDecision: {
    title: string;
    context: string;
    decision: string;
    rationale: string;
  };
};

function computeBuildPassRate(): number {
  const graph = readGraph();
  if (!graph) return 0;
  const reports = Object.values(graph.nodes).filter((n: any) => n.type === "build_report");
  if (reports.length === 0) return 0;
  const passes = reports.filter((r: any) => r.metadata?.status === "pass").length;
  return Math.round((passes / reports.length) * 100);
}

function determineFocus(
  identity: OperationalIdentity,
  objectives: HestiaObjective[],
  decisions: HestiaDecision[],
  blockers: HestiaBlocker[],
  timeline: TimelineIntelligence
): AthenaStrategicDirection {
  const buildPassRate = computeBuildPassRate();
  const activeObjectivesList = objectives.filter((o) => o.status === "active");
  const activeBlockersList = blockers.filter((b) => !b.resolvedAt && b.severity === "blocking");
  const criticalDegradations = timeline.degradationTrend.filter((d) => d.severity === "critical");

  const evidence: string[] = [];
  evidence.push(`Identity: ${identity.status} (${identity.stability}) — confidence ${identity.confidence}/100`);
  evidence.push(`Maturity: ${identity.maturityScore}/100 — phase: ${identity.currentPhase}`);
  evidence.push(`Build pass rate: ${buildPassRate}%`);
  evidence.push(`${activeObjectivesList.length} active objectives, ${activeBlockersList.length} critical blockers`);
  evidence.push(`${criticalDegradations.length} critical degradation signals in pipeline`);
  evidence.push(`Mode: ${timeline.modeActivationHistory.length > 0 ? timeline.modeActivationHistory[0].to : "DELIBERATION_ONLY"}`);

  let strategicFocus: string;
  let recommendedDecisionTitle: string;
  let recommendedDecisionContext: string;
  let recommendedDecision: string;
  let recommendedRationale: string;
  let priorityOrder: string[];
  let whatToAvoid: string[];

  if (identity.status === "recovering" || identity.stability === "degrading") {
    strategicFocus = "Stabilise the build pipeline — critical degradation signals must be resolved before new work begins";
    priorityOrder = [
      "Fix degraded builds: " + criticalDegradations.slice(0, 3).map((d) => d.symptom).join("; "),
      "Resolve " + activeBlockersList.length + " active blocking issue(s)",
      "Consolidate passing builds and create baselines",
      "Only then: advance " + (activeObjectivesList[0]?.title || "next objective")
    ];
    whatToAvoid = [
      "New builds while pipeline is unstable",
      "Expanding into new capabilities",
      "Autonomous overnight runs before stability is restored"
    ];
    recommendedDecisionTitle = "Enter recovery mode: halt new builds until degradation resolved";
    recommendedDecisionContext = `${criticalDegradations.length} build degradations detected, pipeline confidence at ${identity.confidence}/100`;
    recommendedDecision = `Hold all new build work. Route all cycles to fixing the ${criticalDegradations.length} degraded build paths.`;
    recommendedRationale = "Building on an unstable pipeline compounds failures and wastes model calls.";
  } else if (buildPassRate < 50) {
    strategicFocus = `Improve build reliability — current pass rate ${buildPassRate}% is below operational threshold`;
    priorityOrder = [
      "Analyse failure patterns in recent builds",
      "Fix most frequent failure causes",
      "Increase pass rate to >70% before adding new tasks",
      "Then: advance highest-priority objective"
    ];
    whatToAvoid = [
      "Adding complexity to an unreliable pipeline",
      "Parallel build fronts without fixing root cause"
    ];
    recommendedDecisionTitle = "Improve build reliability before expanding surface";
    recommendedDecisionContext = `Build pass rate is ${buildPassRate}%, below the 70% operational threshold`;
    recommendedDecision = "Focus exclusively on fixing build failures. No new tasks until pass rate exceeds 70%.";
    recommendedRationale = "Low pass rate means high waste. Each failure consumes resources without producing value.";
  } else if (activeObjectivesList.length > 0) {
    strategicFocus = `Advance highest-priority objective: "${activeObjectivesList[0].title}"`;
    priorityOrder = [
      `Complete: ${activeObjectivesList[0].title}`,
      ...activeObjectivesList.slice(1).map((o) => `Continue: ${o.title}`),
      "Consolidate learnings and update canonical entities",
      "Prepare for next strategic horizon"
    ];
    whatToAvoid = [
      "Starting new objectives before completing current ones",
      "Ignoring governance signals while focusing on delivery",
      "Expanding scope without updating decisions registry"
    ];
    recommendedDecisionTitle = `Focus on current priority objective: ${activeObjectivesList[0].title}`;
    recommendedDecisionContext = `${activeObjectivesList.length} active objectives, ${activeBlockersList.length} blockers, confidence at ${identity.confidence}/100`;
    recommendedDecision = `Prioritise completion of "${activeObjectivesList[0].title}". Other objectives remain queued.`;
    recommendedRationale = `Scattered effort across ${activeObjectivesList.length} objectives dilutes progress. Completing the top priority builds momentum.`;
  } else {
    strategicFocus = "Define next objective — system is idle with available build capacity";
    priorityOrder = [
      "Analyse recent decisions for strategic gaps",
      "Check degradation signals for maintenance opportunities",
      "Define new objective grounded in current maturity level",
      "Begin execution"
    ];
    whatToAvoid = [
      "Random task selection without strategic grounding",
      `Overambitious objectives beyond current maturity (${identity.maturityScore}/100)`
    ];
    recommendedDecisionTitle = `Define next objective grounded in maturity level ${identity.maturityScore}/100`;
    recommendedDecisionContext = `System idle with ${buildPassRate}% build pass rate and ${identity.maturityScore}/100 maturity`;
    recommendedDecision = "Create a new objective aligned with current maturity phase: " + identity.currentPhase;
    recommendedRationale = "Idle system without direction drifts. A grounded objective provides focus without overreaching current capabilities.";
  }

  return {
    generatedAt: new Date().toISOString(),
    systemState: {
      identity,
      activeObjectives: activeObjectivesList.length,
      pendingDecisions: decisions.length,
      activeBlockers: activeBlockersList.length,
      degradationSignals: criticalDegradations.length,
      buildPassRate
    },
    strategicFocus,
    priorityOrder,
    whatToAvoid,
    why: recommendedRationale,
    evidence,
    recommendedDecision: {
      title: recommendedDecisionTitle,
      context: recommendedDecisionContext,
      decision: recommendedDecision,
      rationale: recommendedRationale
    }
  };
}

export function generateAthenaDirection(): AthenaStrategicDirection {
  const identity = getIdentity();
  const objectives = listActiveObjectives();
  const decisions = listRecentDecisions(20);
  const blockers = listActiveBlockers();
  const timeline = buildTimelineIntelligence();

  const direction = determineFocus(identity, objectives, decisions, blockers, timeline);

  try {
    const dir = path.join(root, "founder-command-center", "olympus", "hestia", "decisions");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `athena-direction-${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(direction, null, 2), "utf-8");
  } catch {}

  return direction;
}

export function formatAthenaDirection(direction: AthenaStrategicDirection): string {
  const lines = [
    "═══ ATHENA ↔ HESTIA STRATEGIC DIRECTION ═══",
    "",
    "── System State (from Hestia) ──",
    `  Identity: ${direction.systemState.identity.status} (${direction.systemState.identity.stability})`,
    `  Confidence: ${direction.systemState.identity.confidence}/100`,
    `  Maturity: ${direction.systemState.identity.maturityScore}/100`,
    `  Build pass rate: ${direction.systemState.buildPassRate}%`,
    `  Active objectives: ${direction.systemState.activeObjectives}`,
    `  Critical blockers: ${direction.systemState.activeBlockers}`,
    `  Degradation signals: ${direction.systemState.degradationSignals}`,
    "",
    "── Strategic Focus ──",
    `  ${direction.strategicFocus}`,
    "",
    "── Priority Order ──",
    ...direction.priorityOrder.map((p, i) => `  ${i + 1}. ${p}`),
    "",
    "── What to Avoid ──",
    ...direction.whatToAvoid.map((a) => `  ⚠️ ${a}`),
    "",
    "── Why ──",
    `  ${direction.why}`,
    "",
    "── Evidence ──",
    ...direction.evidence.map((e) => `  • ${e}`),
    "",
    "── Recommended Decision ──",
    `  Title: ${direction.recommendedDecision.title}`,
    `  Context: ${direction.recommendedDecision.context}`,
    `  Decision: ${direction.recommendedDecision.decision}`,
    `  Rationale: ${direction.recommendedDecision.rationale}`,
    ""
  ];
  return lines.join("\n");
}