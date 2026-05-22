import fs from "fs";
import path from "path";
import { readRecentEvents } from "../zeus/zeusControlPlane";
import { readGraph } from "./hestiaEntityGraph";

const root = process.cwd();

// ── Types ──

export type TimelineEvent = {
  at: string;
  source: string;
  type: string;
  summary: string;
  category: "build" | "decision" | "mode_change" | "error" | "report" | "approval" | "system";
};

export type ChangeWindow = {
  period: "24h" | "7d" | "30d";
  eventCount: number;
  events: TimelineEvent[];
  summary: string;
};

export type DegradationSignal = {
  buildId: string;
  taskId?: string;
  timestamp: string;
  symptom: string;
  severity: "critical" | "warning" | "info";
  previousBuildStatus?: string;
};

export type TimelineIntelligence = {
  changes24h: ChangeWindow;
  changes7d: ChangeWindow;
  degradationTrend: DegradationSignal[];
  modeActivationHistory: Array<{ at: string; from: string; to: string }>;
  keyMilestones: string[];
};

// ── Helpers ──

const MORNING_DIR = path.join(root, "founder-command-center", "runtime", "morning");
const OVERNIGHT_DIR = path.join(root, "founder-command-center", "runtime", "overnight", "reports");

function readJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch { return null; }
}

function latestFiles(dirPath: string, extension = "", limit = 50): string[] {
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
    .map((item) => item.fullPath);
}

function getBuildReports(): any[] {
  const reportsDir = path.join(root, "founder-command-center", "build-system", "reports");
  return latestFiles(reportsDir, ".json", 30)
    .map((f) => readJson(f))
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

function getMorningReports(): any[] {
  return latestFiles(MORNING_DIR, ".json", 14)
    .map((f) => readJson(f))
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime());
}

function getOvernightReports(): any[] {
  return latestFiles(OVERNIGHT_DIR, ".json", 14)
    .map((f) => readJson(f))
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.finishedAt || 0).getTime() - new Date(a.finishedAt || 0).getTime());
}

// ── Build change window ──

function buildChangeWindow(events: any[], hours: number): ChangeWindow {
  const cutoff = Date.now() - hours * 3600 * 1000;

  const filtered = events.filter((e) => {
    const eventTime = new Date(e.at || e.createdAt || 0).getTime();
    return eventTime > cutoff;
  });

  const timelineEvents: TimelineEvent[] = filtered.map((e: any) => {
    let category: TimelineEvent["category"] = "system";
    const type = (e.type || e.source || "").toLowerCase();
    if (type.includes("build") || type.includes("pipeline")) category = "build";
    else if (type.includes("decision") || type.includes("dec")) category = "decision";
    else if (type.includes("mode")) category = "mode_change";
    else if (type.includes("error") || type.includes("fail")) category = "error";
    else if (type.includes("report") || type.includes("morning")) category = "report";
    else if (type.includes("approval")) category = "approval";

    return {
      at: e.at || e.createdAt || e.generatedAt || "unknown",
      source: e.source || "unknown",
      type: e.type || "unknown",
      summary: e.summary || e.title || "unknown",
      category
    };
  });

  return {
    period: hours === 24 ? "24h" : hours === 168 ? "7d" : "30d",
    eventCount: timelineEvents.length,
    events: timelineEvents,
    summary: `${timelineEvents.length} events in the last ${hours >= 168 ? `${hours / 168} weeks` : `${hours}h`}`
  };
}

// ── Degradation Detection ──

function detectDegradation(): DegradationSignal[] {
  const signals: DegradationSignal[] = [];
  const reports = getBuildReports();

  for (let i = 0; i < reports.length - 1; i++) {
    const current = reports[i];
    const previous = reports[i + 1];

    if (current.status === "fail" && previous.status === "pass") {
      signals.push({
        buildId: current.id || "unknown",
        taskId: current.taskId,
        timestamp: current.createdAt,
        symptom: `Build degraded from pass to fail for task "${current.taskTitle || current.taskId}"`,
        severity: "critical",
        previousBuildStatus: previous.status
      });
    }

    // Warning: consecutive failures
    if (current.status === "fail" && previous.status === "fail") {
      signals.push({
        buildId: current.id || "unknown",
        taskId: current.taskId,
        timestamp: current.createdAt,
        symptom: `Consecutive build failures for "${current.taskTitle || current.taskId}"`,
        severity: "warning",
        previousBuildStatus: previous.status
      });
    }

    // Warning: build took unusually long
    if (current.steps && Array.isArray(current.steps)) {
      const totalDuration = current.steps.reduce((sum: number, s: any) => sum + (s.durationMs || 0), 0);
      if (totalDuration > 600000) {
        // > 10 minutes
        signals.push({
          buildId: current.id || "unknown",
          taskId: current.taskId,
          timestamp: current.createdAt,
          symptom: `Build took ${Math.round(totalDuration / 1000)}s, which is unusually long`,
          severity: "warning",
          previousBuildStatus: previous?.status
        });
      }
    }
  }

  return signals;
}

// ── Mode Activation History ──

function getModeActivationHistory(): Array<{ at: string; from: string; to: string }> {
  const events = readRecentEvents(200);
  return events
    .filter((e) => e.type === "mode_changed")
    .map((e) => ({
      at: e.at,
      from: (e.data as any)?.previousMode || "unknown",
      to: (e.data as any)?.newMode || "unknown"
    }));
}

// ── Key Milestones ──

function getKeyMilestones(): string[] {
  const milestones: string[] = [];

  const events = readRecentEvents(500);

  // Find first SAFE_AUTONOMOUS_BUILD activation
  const firstAutonomous = events.find((e) => e.type === "mode_changed" && (e.data as any)?.newMode === "SAFE_AUTONOMOUS_BUILD");
  if (firstAutonomous) {
    milestones.push(`🔐 SAFE_AUTONOMOUS_BUILD first activated: ${firstAutonomous.at.split(".")[0]}Z`);
  }

  // Find gateway_synced events
  const syncEvents = events.filter((e) => e.type === "gateway_synced");
  if (syncEvents.length > 0) {
    milestones.push(`📡 Gateway synced ${syncEvents.length} times`);
  }

  // Find overnight runs
  const overnightReports = getOvernightReports();
  if (overnightReports.length > 0) {
    const totalCycles = overnightReports.reduce((sum, r) => sum + (r.summary?.totalCycles || 0), 0);
    const totalApplied = overnightReports.reduce((sum, r) => sum + (r.summary?.autonomouslyApplied || 0), 0);
    const totalFailed = overnightReports.reduce((sum, r) => sum + (r.summary?.failed || 0), 0);
    milestones.push(`🌙 ${overnightReports.length} overnight runs — ${totalCycles} cycles — ${totalApplied} applied — ${totalFailed} failed`);
  }

  // Find morning reports
  const morningReports = getMorningReports();
  if (morningReports.length > 0) {
    milestones.push(`🌅 ${morningReports.length} morning reports generated`);
  }

  // Build reports
  const buildReports = getBuildReports();
  const passCount = buildReports.filter((r) => r.status === "pass").length;
  const failCount = buildReports.filter((r) => r.status === "fail").length;
  milestones.push(`🏗️ ${buildReports.length} builds — ${passCount} pass — ${failCount} fail`);

  return milestones;
}

// ── Main Timeline Intelligence ──

export function buildTimelineIntelligence(): TimelineIntelligence {
  const zeusEvents = readRecentEvents(500);
  const buildReports = getBuildReports();
  const morningReports = getMorningReports();
  const overnightReports = getOvernightReports();

  // Merge all events chronologically
  const allEvents = [
    ...zeusEvents.map((e) => ({ ...e, at: e.at })),
    ...buildReports.map((r) => ({ ...r, at: r.createdAt, source: "build-system", type: "build_report", summary: `Build ${r.status}: ${r.taskTitle || r.taskId}` })),
    ...morningReports.map((r) => ({ ...r, at: r.generatedAt, source: "morning", type: "morning_report", summary: `Morning report — ${r.overnight?.results?.autonomouslyApplied || 0} applied, ${r.overnight?.results?.failed || 0} failed` })),
    ...overnightReports.map((r) => ({ ...r, at: r.finishedAt, source: "overnight", type: "overnight_report", summary: `Overnight: ${r.summary?.totalCycles || 0} cycles, ${r.summary?.autonomouslyApplied || 0} applied` }))
  ].filter((e) => e.at && e.at !== "unknown");

  return {
    changes24h: buildChangeWindow(allEvents, 24),
    changes7d: buildChangeWindow(allEvents, 168),
    degradationTrend: detectDegradation(),
    modeActivationHistory: getModeActivationHistory(),
    keyMilestones: getKeyMilestones()
  };
}

// ── Format ──

export function formatTimelineIntelligence(tl: TimelineIntelligence): string {
  const lines = [
    "═══ HESTIA TIMELINE INTELLIGENCE ═══",
    "",
    "── Last 24h Changes ──",
    `  Events: ${tl.changes24h.eventCount}`,
    ...tl.changes24h.events.slice(0, 10).map((e) => `  ${e.at.split("T")[1]?.slice(0, 8) || e.at} [${e.category}] ${e.summary}`),
    tl.changes24h.events.length > 10 ? `  ... and ${tl.changes24h.events.length - 10} more` : "",
    "",
    "── Last 7 Days ──",
    `  Events: ${tl.changes7d.eventCount}`,
    ...tl.changes7d.events.slice(0, 5).map((e) => `  ${e.at.slice(0, 16) || e.at} [${e.category}] ${e.summary}`),
    tl.changes7d.events.length > 5 ? `  ... and ${tl.changes7d.events.length - 5} more` : "",
    "",
    "── Degradation Signals ──",
    ...(tl.degradationTrend.length === 0
      ? ["  ✅ No degradation detected."]
      : tl.degradationTrend.map((d) => {
          const icon = d.severity === "critical" ? "🔴" : d.severity === "warning" ? "🟡" : "🟢";
          return `  ${icon} ${d.symptom}`;
        })),
    "",
    "── Mode Activation History ──",
    ...(tl.modeActivationHistory.length === 0
      ? ["  No mode changes recorded."]
      : tl.modeActivationHistory.map((m) => `  ${m.at.slice(0, 16)} ${m.from} → ${m.to}`)),
    "",
    "── Key Milestones ──",
    ...tl.keyMilestones.map((m) => `  ${m}`),
    ""
  ];

  // Filter out empty strings from the map results
  return lines.filter((l) => l !== "").join("\n");
}

// ── Answer Questions ──

export function answerTimelineQuestion(question: string): string {
  const tl = buildTimelineIntelligence();
  const q = question.toLowerCase();

  if (q.includes("24h") || q.includes("24 horas") || q.includes("últimas horas") || q.includes("mudou nas últimas")) {
    return formatTimelineWindow(tl.changes24h, "last 24h");
  }

  if (q.includes("7 dias") || q.includes("semana") || q.includes("últimos dias")) {
    return formatTimelineWindow(tl.changes7d, "last 7 days");
  }

  if (q.includes("build") && (q.includes("degrad") || q.includes("fail") || q.includes("pior"))) {
    const criticalDegradations = tl.degradationTrend.filter((d) => d.severity === "critical");
    if (criticalDegradations.length === 0) {
      return "No critical build degradation detected.";
    }
    return criticalDegradations.map((d) => `🔴 ${d.timestamp.slice(0, 16)} — ${d.symptom}`).join("\n");
  }

  if (q.includes("safe_autonomous") || q.includes("modo") || q.includes("autónomo") || q.includes("autonomo")) {
    const activations = tl.modeActivationHistory.map((m) => `${m.at.slice(0, 16)}: ${m.from} → ${m.to}`);
    return activations.length > 0
      ? `Mode activation history:\n${activations.join("\n")}`
      : "No mode activations recorded.";
  }

  if (q.includes("milestone") || q.includes("marco") || q.includes("importante") || q.includes("aconteceu")) {
    return tl.keyMilestones.map((m) => `  ${m}`).join("\n");
  }

  return formatTimelineIntelligence(tl);
}

function formatTimelineWindow(window: ChangeWindow, label: string): string {
  if (window.eventCount === 0) return `No events in the ${label}.`;

  const byCategory = new Map<string, number>();
  for (const event of window.events) {
    byCategory.set(event.category, (byCategory.get(event.category) || 0) + 1);
  }

  const categoryLine = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(", ");

  return [
    `═══ ${label.toUpperCase()} ═══`,
    `Total: ${window.eventCount} events`,
    `Breakdown: ${categoryLine}`,
    "",
    ...window.events.slice(0, 15).map((e) => `${e.at.slice(0, 16)} [${e.category}] ${e.summary}`),
    window.events.length > 15 ? `... and ${window.events.length - 15} more` : ""
  ].join("\n");
}