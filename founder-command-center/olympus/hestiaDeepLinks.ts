import fs from "fs";
import path from "path";
import { readGraph, writeGraph, EntityGraph, EntityEdge, EntityNode } from "./hestiaEntityGraph";
import { readGatewayState, readRecentEvents } from "../zeus/zeusControlPlane";
import { readOperationalContext } from "../chat/zeusOperationalContext";
import { registerCanonical, resolveToCanonical, linkEntityToCanonical } from "./hestiaCanonical";

const root = process.cwd();

// ── Helpers ──

function readJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch { return null; }
}

function findNodeById(graph: EntityGraph, id: string): EntityNode | undefined {
  return Object.values(graph.nodes).find((n) => n.id === id);
}

// ── Edge creation helper ──

function addEdge(graph: EntityGraph, source: string, target: string, relation: EntityEdge["relation"], weight = 1) {
  const exists = graph.edges.some((e) => e.source === source && e.target === target && e.relation === relation);
  if (!exists && findNodeById(graph, source) && findNodeById(graph, target)) {
    graph.edges.push({ source, target, relation, weight });
  }
}

// ── 1. Build → Task (from report metadata) ──

function linkBuildToTask(graph: EntityGraph): number {
  let count = 0;
  for (const node of Object.values(graph.nodes)) {
    if (node.type === "build_report" && node.metadata.taskId) {
      const taskId = node.metadata.taskId as string;
      const taskNodeId = `task-${taskId}`;
      addEdge(graph, taskNodeId, node.id, "triggered");
      addEdge(graph, node.id, taskNodeId, "referenced");

      // Link to canonical
      const canonical = resolveToCanonical(taskId);
      if (canonical) {
        linkEntityToCanonical(canonical.canonicalId, node.id);
        linkEntityToCanonical(canonical.canonicalId, taskNodeId);
      }
      count++;
    }
  }
  return count;
}

// ── 2. Task → Patch (match names) ──

function linkTaskToPatch(graph: EntityGraph): number {
  let count = 0;
  for (const node of Object.values(graph.nodes)) {
    if (node.type === "patch_candidate") {
      const label = node.label.toLowerCase().replace(/[-_]/g, " ");
      // Try to find a matching task
      for (const taskNode of Object.values(graph.nodes)) {
        if (taskNode.type === "task") {
          const taskLabel = taskNode.label.toLowerCase().replace(/[-_]/g, " ");
          if (label.includes(taskLabel) || taskLabel.includes(label)) {
            addEdge(graph, node.id, taskNode.id, "generated");
            count++;
          }
        }
      }
    }
  }
  return count;
}

// ── 3. Patch → Report ──

function linkPatchToReport(graph: EntityGraph): number {
  let count = 0;
  const patchNodes = Object.values(graph.nodes).filter((n) => n.type === "patch_candidate");
  const reportNodes = Object.values(graph.nodes).filter((n) => n.type === "build_report");
  for (const patch of patchNodes) {
    for (const report of reportNodes) {
      // Temporal proximity: within 24 hours
      const patchTime = new Date(patch.createdAt).getTime();
      const reportTime = new Date(report.createdAt).getTime();
      if (Math.abs(patchTime - reportTime) < 86400000) {
        addEdge(graph, patch.id, report.id, "related_to");
        count++;
      }
    }
  }
  return count;
}

// ── 4. Report → Degradation (match build ids from timeline) ──

function linkReportToDegradation(graph: EntityGraph): number {
  let count = 0;
  const reports = Object.values(graph.nodes).filter((n) => n.type === "build_report");
  // Find consecutive failures
  const sorted = reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const prev = sorted[i + 1];
    const currentStatus = current.metadata?.status as string;
    const prevStatus = prev.metadata?.status as string;
    if (currentStatus === "fail" && prevStatus === "pass") {
      addEdge(graph, current.id, prev.id, "failed");
      count++;
    }
    if (currentStatus === "fail" && prevStatus === "fail") {
      addEdge(graph, current.id, prev.id, "failed");
      count++;
    }
  }
  return count;
}

// ── 5. Degradation → Objective (match context) ──

function linkDegradationToObjective(graph: EntityGraph): number {
  let count = 0;
  const objectivesDir = path.join(root, "founder-command-center", "olympus", "hestia", "objectives");
  if (!fs.existsSync(objectivesDir)) return count;

  const failedBuilds = graph.edges.filter((e) => e.relation === "failed");
  for (const edge of failedBuilds) {
    const sourceNode = findNodeById(graph, edge.source);
    if (!sourceNode) continue;
    const taskId = sourceNode.metadata?.taskId as string;
    if (!taskId) continue;

    // Search objectives that match the task
    try {
      const objFiles = fs.readdirSync(objectivesDir).filter((f) => f.endsWith(".json"));
      for (const file of objFiles) {
        const obj = readJson(path.join(objectivesDir, file));
        if (!obj) continue;
        const objTitle = (obj.title || "").toLowerCase();
        const taskLower = taskId.toLowerCase().replace(/[-_]/g, " ");
        if (objTitle.includes(taskLower) || taskLower.includes(objTitle)) {
          addEdge(graph, `obj-${obj.id}`, edge.source, "related_to");
          count++;
        }
      }
    } catch { continue; }
  }
  return count;
}

// ── 6. Objective → Session ──

function linkObjectiveToSession(graph: EntityGraph): number {
  let count = 0;
  const sessionPath = path.join(root, "founder-command-center", "olympus", "hestia", "current-session.json");
  const session = readJson(sessionPath);
  if (!session) return count;

  // Link active objectives to session
  if (session.activeObjectives && Array.isArray(session.activeObjectives)) {
    for (const objId of session.activeObjectives) {
      addEdge(graph, `ses-${session.sessionId || "current"}`, objId, "related_to");
      count++;
    }
  }

  // Link session to current build task
  const context = readOperationalContext();
  if (context.buildTask?.id) {
    addEdge(graph, `ses-${session.sessionId || "current"}`, `task-${context.buildTask.id}`, "related_to");
    count++;
  }

  return count;
}

// ── 7. Provider → Task (which tasks used which provider) ──

function linkProviderToTask(graph: EntityGraph): number {
  let count = 0;
  const providersDir = path.join(root, "founder-command-center", "providers");
  if (!fs.existsSync(providersDir)) return count;

  const buildTaskPath = path.join(root, "founder-command-center", "runtime", "buildTask.json");
  const buildTask = readJson(buildTaskPath);
  if (!buildTask?.provider) return count;

  const provider = buildTask.provider as string;
  const taskId = buildTask.id as string;
  if (provider && taskId) {
    addEdge(graph, `provider-${provider}`, `task-${taskId}`, "depends_on");
    count++;
  }

  return count;
}

// ── 8. Session → Provider ──

function linkSessionToProvider(graph: EntityGraph): number {
  let count = 0;
  const gateway = readGatewayState();
  if (!gateway) return count;

  if (gateway.runtime.tsxAvailable) {
    addEdge(graph, "ses-current", "runtime-tsx", "depends_on");
    count++;
  }
  if (gateway.runtime.pythonAvailable) {
    addEdge(graph, "ses-current", "runtime-python", "depends_on");
    count++;
  }

  return count;
}

// ── 9. Cross-link from event journal ──

function linkFromEvents(graph: EntityGraph): number {
  let count = 0;
  const events = readRecentEvents(200);
  for (const event of events) {
    if (event.type === "mode_changed") {
      const data = event.data as any;
      addEdge(graph, "gateway", "gateway", "related_to");
      count++;
    }
  }
  return count;
}

// ── 10. Populate node metadata with canonical ids ──

function linkWithCanonicalIds(graph: EntityGraph): number {
  let count = 0;
  for (const node of Object.values(graph.nodes)) {
    const label = node.label || node.id;
    const canonical = resolveToCanonical(label);
    if (canonical) {
      (node.metadata as any).canonicalId = canonical.canonicalId;
      count++;
      // Create edge
      addEdge(graph, canonical.canonicalId, node.id, "related_to");
    } else {
      // Auto-register if it looks like a real entity
      const cleanId = node.id.replace(/^(task-|build-|approval-|patch-)/, "").replace(/[-_]/g, " ");
      if (cleanId.length > 3 && !cleanId.match(/^\d+$/)) {
        const canonical = registerCanonical(cleanId, "module", ["auto-discovered"]);
        (node.metadata as any).canonicalId = canonical.canonicalId;
        addEdge(graph, canonical.canonicalId, node.id, "related_to");
        count++;
      }
    }
  }
  return count;
}

// ── Main: Run all deep linkers ──

export function runDeepLinking(): { graph: EntityGraph; stats: Record<string, number> } {
  let graph = readGraph() || { nodes: {}, edges: [], updatedAt: new Date().toISOString() };

  const linkerResults: Record<string, number> = {};
  const linkers = [
    ["build→task", linkBuildToTask],
    ["task→patch", linkTaskToPatch],
    ["patch→report", linkPatchToReport],
    ["report→degradation", linkReportToDegradation],
    ["degradation→objective", linkDegradationToObjective],
    ["objective→session", linkObjectiveToSession],
    ["provider→task", linkProviderToTask],
    ["session→provider", linkSessionToProvider],
    ["events", linkFromEvents],
    ["canonical", linkWithCanonicalIds]
  ] as const;

  for (const [name, linker] of linkers) {
    try {
      linkerResults[name] = linker(graph);
    } catch (e: any) {
      linkerResults[name] = -1;
    }
  }

  graph.updatedAt = new Date().toISOString();
  writeGraph(graph);

  return { graph, stats: linkerResults };
}

export function printDeepLinkSummary(stats: Record<string, number>): string {
  const total = Object.values(stats).reduce((s, v) => s + (v > 0 ? v : 0), 0);
  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  return [
    "═══ DEEP CROSS-LINKING ═══",
    `Total new links: ${total}`,
    "",
    "── Linker results ──",
    ...sorted.map(([name, count]) => {
      const icon = count >= 0 ? (count > 0 ? "✅" : "ℹ️") : "❌";
      return `  ${icon} ${name}: ${count >= 0 ? count : "error"}`;
    }),
    ""
  ].join("\n");
}