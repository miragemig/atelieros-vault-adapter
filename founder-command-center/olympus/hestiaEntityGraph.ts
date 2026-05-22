import fs from "fs";
import path from "path";

const root = process.cwd();

// ── Directories we scan for entity links ──
const SCAN_PATHS = {
  patchSystem: "founder-command-center/patch-system/patch-candidates",
  patchReports: "founder-command-center/patch-system/patch-reports",
  buildReports: "founder-command-center/build-system/reports",
  approvals: "founder-command-center/hermes/approvals",
  sendGates: "founder-command-center/hermes/send-gates",
  outbox: "founder-command-center/hermes/outbox",
  quarantine: "founder-command-center/build-system/quarantine",
  buildSystem: "founder-command-center/build-system",
  providers: "founder-command-center/providers",
  agents: "founder-command-center/agents",
  olympus: "founder-command-center/olympus",
  zeus: "founder-command-center/zeus",
  hestiaMemory: "founder-command-center/olympus/hestia",
  hestiaDecisions: "founder-command-center/olympus/hestia/decisions",
  hestiaObjectives: "founder-command-center/olympus/hestia/objectives",
  overnight: "founder-command-center/runtime/overnight/reports",
  morning: "founder-command-center/runtime/morning",
  runtime: "founder-command-center/runtime"
};

// ── Types ──

export type EntityNodeType =
  | "patch_candidate"
  | "patch_report"
  | "build_report"
  | "approval"
  | "send_gate"
  | "outbox"
  | "quarantine_draft"
  | "provider"
  | "agent"
  | "olympus_god"
  | "decision"
  | "objective"
  | "overnight_report"
  | "morning_report"
  | "event"
  | "task"
  | "build_system_file";

export type EntityNode = {
  id: string;
  type: EntityNodeType;
  label: string;
  sourcePath: string;
  createdAt: string;
  modifiedAt: string;
  metadata: Record<string, unknown>;
};

export type EntityEdge = {
  source: string;
  target: string;
  relation: "created_by" | "triggered" | "validated" | "approved" | "applied" |
    "referenced" | "failed" | "skipped" | "depends_on" | "related_to" | "generated" | "sends";
  weight: number;
};

export type EntityGraph = {
  nodes: Record<string, EntityNode>;
  edges: EntityEdge[];
  updatedAt: string;
};

const GRAPH_PATH = path.join(root, "founder-command-center", "olympus", "hestia", "entity-graph.json");

// ── Helpers ──

function readJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch { return null; }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function timestamp(): string {
  return new Date().toISOString();
}

function latestFiles(dirPath: string, extension = "", limit = 100): Array<{ file: string; fullPath: string; time: number }> {
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
    .slice(0, limit);
}

// ── Scanning ──

function scanDirectory(
  dirKey: keyof typeof SCAN_PATHS,
  nodeType: EntityNodeType,
  extension = "",
  idPrefix: string
): EntityNode[] {
  const dirPath = path.join(root, SCAN_PATHS[dirKey]);
  const files = latestFiles(dirPath, extension, 200);
  return files.map((f) => ({
    id: `${idPrefix}-${f.file.replace(extension, "").replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    type: nodeType,
    label: f.file,
    sourcePath: f.fullPath,
    createdAt: new Date(f.time).toISOString(),
    modifiedAt: new Date(f.time).toISOString(),
    metadata: {}
  }));
}

function scanJsonFiles(
  dirKey: keyof typeof SCAN_PATHS,
  nodeType: EntityNodeType,
  idPrefix: string
): EntityNode[] {
  const dirPath = path.join(root, SCAN_PATHS[dirKey]);
  const files = latestFiles(dirPath, ".json", 200);
  return files.map((f) => {
    const content = readJson(f.fullPath);
    return {
      id: `${idPrefix}-${content?.id || f.file.replace(".json", "").replace(/[^a-zA-Z0-9_-]/g, "-")}`,
      type: nodeType,
      label: content?.title || content?.name || content?.taskId || f.file,
      sourcePath: f.fullPath,
      createdAt: content?.createdAt || content?.startedAt || new Date(f.time).toISOString(),
      modifiedAt: content?.updatedAt || new Date(f.time).toISOString(),
      metadata: content ? extractRelevantMetadata(content, nodeType) : {}
    };
  });
}

function extractRelevantMetadata(content: any, nodeType: EntityNodeType): Record<string, unknown> {
  switch (nodeType) {
    case "build_report":
      return {
        status: content.status,
        taskId: content.taskId,
        taskTitle: content.taskTitle
      };
    case "approval":
      return {
        status: content.status,
        approvedBy: content.approvedBy
      };
    case "overnight_report":
      return {
        totalCycles: content.summary?.totalCycles,
        autonomouslyApplied: content.summary?.autonomouslyApplied,
        failed: content.summary?.failed
      };
    case "morning_report":
      return {
        overnightTotal: content.overnight?.totalCycles,
        applied: content.overnight?.results?.autonomouslyApplied,
        failed: content.overnight?.results?.failed
      };
    default:
      return {};
  }
}

// ── Edge Detection ──

function detectEdges(
  taskNodes: EntityNode[],
  buildReportNodes: EntityNode[],
  approvalNodes: EntityNode[],
  overnightNodes: EntityNode[],
  morningNodes: EntityNode[]
): EntityEdge[] {
  const edges: EntityEdge[] = [];

  // Link build reports to tasks by taskId
  for (const report of buildReportNodes) {
    if (report.metadata.taskId) {
      const taskId = report.metadata.taskId as string;
      edges.push({
        source: `task-${taskId}`,
        target: report.id,
        relation: "triggered",
        weight: 1
      });
      edges.push({
        source: report.id,
        target: `task-${taskId}`,
        relation: "referenced",
        weight: 1
      });
    }
    // Link reports to approvals by temporal proximity
    for (const approval of approvalNodes) {
      const reportTime = new Date(report.createdAt).getTime();
      const approvalTime = new Date(approval.createdAt).getTime();
      if (Math.abs(reportTime - approvalTime) < 3600000) {
        edges.push({
          source: approval.id,
          target: report.id,
          relation: "approved",
          weight: 1
        });
      }
    }
  }

  // Link overnight reports to build reports
  for (const overnight of overnightNodes) {
    for (const report of buildReportNodes) {
      const overnightTime = new Date(overnight.createdAt).getTime();
      const reportTime = new Date(report.createdAt).getTime();
      const diffHours = Math.abs(overnightTime - reportTime) / 3600000;
      if (diffHours < 12) {
        edges.push({
          source: overnight.id,
          target: report.id,
          relation: "generated",
          weight: 1
        });
      }
    }
  }

  // Link morning reports to overnight reports
  for (const morning of morningNodes) {
    for (const overnight of overnightNodes) {
      const morningTime = new Date(morning.createdAt).getTime();
      const overnightTime = new Date(overnight.createdAt).getTime();
      const diffHours = Math.abs(morningTime - overnightTime) / 3600000;
      if (diffHours < 24) {
        edges.push({
          source: morning.id,
          target: overnight.id,
          relation: "related_to",
          weight: 1
        });
      }
    }
  }

  return edges;
}

// ── Main scan ──

export function scanEntityGraph(): EntityGraph {
  const existing = readJson(GRAPH_PATH) as EntityGraph | null;
  const nodes: Record<string, EntityNode> = existing?.nodes || {};
  const edges: EntityEdge[] = existing?.edges || [];

  // Scan all directories
  const taskNodes: EntityNode[] = [];
  const buildReportNodes = scanJsonFiles("buildReports", "build_report", "build");
  const approvalNodes = scanJsonFiles("approvals", "approval", "approval");
  const sendGateNodes = scanJsonFiles("sendGates", "send_gate", "send-gate");
  const outboxNodes = scanJsonFiles("outbox", "outbox", "outbox");
  const overnightNodes = scanJsonFiles("overnight", "overnight_report", "overnight");
  const morningNodes = scanJsonFiles("morning", "morning_report", "morning");
  const patchCandidates = scanDirectory("patchSystem", "patch_candidate", "", "patch");
  const patchReports = scanDirectory("patchReports", "patch_report", ".json", "patch-rpt");
  const quarantineDrafts = scanDirectory("quarantine", "quarantine_draft", ".ts", "quarantine");
  const decisionNodes = scanJsonFiles("hestiaDecisions", "decision", "dec");
  const objectiveNodes = scanJsonFiles("hestiaObjectives", "objective", "obj");

  // Add task nodes from build reports metadata
  const uniqueTaskIds = new Set(buildReportNodes.map((r) => r.metadata.taskId).filter(Boolean));
  for (const taskId of uniqueTaskIds) {
    const nodeId = `task-${taskId}`;
    taskNodes.push({
      id: nodeId,
      type: "task",
      label: `Task: ${taskId}`,
      sourcePath: path.join(root, "founder-command-center", "runtime", "buildTask.json"),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      metadata: { taskId }
    });
  }

  // Merge all nodes, deduplicating by id
  const allNodeArrays = [
    taskNodes, buildReportNodes, approvalNodes, sendGateNodes,
    outboxNodes, overnightNodes, morningNodes, patchCandidates,
    patchReports, quarantineDrafts, decisionNodes, objectiveNodes
  ];

  for (const nodeArray of allNodeArrays) {
    for (const node of nodeArray) {
      if (!nodes[node.id]) {
        nodes[node.id] = node;
      } else {
        // Update modifiedAt if this node is newer
        const existingTime = new Date(nodes[node.id].modifiedAt).getTime();
        const newTime = new Date(node.modifiedAt).getTime();
        if (newTime > existingTime) {
          nodes[node.id] = node;
        }
      }
    }
  }

  // Detect edges
  const newEdges = detectEdges(taskNodes, buildReportNodes, approvalNodes, overnightNodes, morningNodes);
  for (const edge of newEdges) {
    // Avoid duplicate edges
    const exists = edges.some(
      (e) => e.source === edge.source && e.target === edge.target && e.relation === edge.relation
    );
    if (!exists) {
      edges.push(edge);
    }
  }

  const graph: EntityGraph = { nodes, edges, updatedAt: timestamp() };
  writeGraph(graph);
  return graph;
}

export function writeGraph(graph: EntityGraph) {
  ensureDir(path.dirname(GRAPH_PATH));
  fs.writeFileSync(GRAPH_PATH, JSON.stringify(graph, null, 2), "utf-8");
}

export function readGraph(): EntityGraph | null {
  return readJson(GRAPH_PATH) as EntityGraph | null;
}

export function printGraphSummary(): string {
  const graph = readGraph();
  if (!graph) return "Entity graph not yet built. Run `zeus hestia-graph` first.";

  const nodeTypes = new Map<string, number>();
  const relationTypes = new Map<string, number>();

  for (const node of Object.values(graph.nodes)) {
    nodeTypes.set(node.type, (nodeTypes.get(node.type) || 0) + 1);
  }
  for (const edge of graph.edges) {
    relationTypes.set(edge.relation, (relationTypes.get(edge.relation) || 0) + 1);
  }

  return [
    "═══ HESTIA ENTITY GRAPH ═══",
    "",
    `Last updated: ${graph.updatedAt}`,
    `Total nodes: ${Object.keys(graph.nodes).length}`,
    `Total edges: ${graph.edges.length}`,
    "",
    "── Nodes by type ──",
    ...[...nodeTypes.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `  ${type}: ${count}`),
    "",
    "── Relations ──",
    ...[...relationTypes.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([rel, count]) => `  ${rel}: ${count}`),
    ""
  ].join("\n");
}

// ── Queries ──

export function findRelatedEntities(entityId: string, maxDepth = 2): EntityNode[] {
  const graph = readGraph();
  if (!graph) return [];

  const visited = new Set<string>();
  const result: EntityNode[] = [];
  let frontier = [entityId];

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);

      const node = graph.nodes[id];
      if (node && id !== entityId) {
        result.push(node);
      }

      // Find connected nodes
      for (const edge of graph.edges) {
        if (edge.source === id && !visited.has(edge.target)) {
          next.push(edge.target);
        }
        if (edge.target === id && !visited.has(edge.source)) {
          next.push(edge.source);
        }
      }
    }
    frontier = next;
  }
  return result;
}

export function queryGraph(
  filters: { type?: EntityNodeType; labelContains?: string; since?: string }
): EntityNode[] {
  const graph = readGraph();
  if (!graph) return [];

  return Object.values(graph.nodes).filter((node) => {
    if (filters.type && node.type !== filters.type) return false;
    if (filters.labelContains && !node.label.toLowerCase().includes(filters.labelContains.toLowerCase())) return false;
    if (filters.since && new Date(node.createdAt).getTime() < new Date(filters.since).getTime()) return false;
    return true;
  });
}

// ── Stats ──

export function getGraphStats() {
  const graph = readGraph();
  if (!graph) return null;

  const nodesByType: Record<string, number> = {};
  const edgesByRelation: Record<string, number> = {};
  let totalConnections = 0;

  for (const node of Object.values(graph.nodes)) {
    nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
  }

  for (const edge of graph.edges) {
    edgesByRelation[edge.relation] = (edgesByRelation[edge.relation] || 0) + 1;
    totalConnections++;
  }

  return {
    totalNodes: Object.keys(graph.nodes).length,
    totalEdges: graph.edges.length,
    nodeTypeCounts: nodesByType,
    relationCounts: edgesByRelation,
    avgConnectionsPerNode: Object.keys(graph.nodes).length > 0
      ? (totalConnections / Object.keys(graph.nodes).length).toFixed(1)
      : "0"
  };
}