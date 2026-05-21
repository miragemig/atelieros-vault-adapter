import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  olympusAgents,
  getAgentsByOperationalStatus,
  getCanonicalOlympusAgents
} from "../olympus/agentRegistry";
import { zeusCapabilities } from "../capabilities/capabilityRegistry";
import {
  readGatewayState,
  readRecentEvents,
  syncGatewayState
} from "./zeusControlPlane";

const root = process.cwd();

function safeExec(command: string): string {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch {
    return "";
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

function latestFiles(dirPath: string, limit = 5): string[] {
  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath)
    .map((file) => ({
      file,
      fullPath: path.join(dirPath, file),
      time: fs.statSync(path.join(dirPath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time)
    .slice(0, limit)
    .map((item) => item.file);
}

function countBy<T extends string>(items: T[]): Record<T, number> {
  return items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

function printHeader(title: string) {
  console.log("");
  console.log("=".repeat(72));
  console.log(title);
  console.log("=".repeat(72));
}

function printList(items: string[], emptyText = "none") {
  if (items.length === 0) {
    console.log(`- ${emptyText}`);
    return;
  }

  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function getRoadmapSummary() {
  const queuePath = path.join(
    root,
    "founder-command-center",
    "runtime",
    "roadmapQueueState.json"
  );

  const queue = readJson(queuePath);

  if (!queue?.tasks) {
    return {
      exists: false,
      counts: {},
      latest: []
    };
  }

  const statuses = queue.tasks.map((task: any) => task.status || "unknown");
  const counts = countBy(statuses);

  const latest = [...queue.tasks]
    .sort((a: any, b: any) => {
      const aTime = new Date(a.updatedAt || a.startedAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.startedAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 5)
    .map((task: any) => `${task.id} [${task.status}]`);

  return {
    exists: true,
    counts,
    latest
  };
}

function getPatchCandidates() {
  const candidatesDir = path.join(
    root,
    "founder-command-center",
    "patch-system",
    "patch-candidates"
  );

  if (!fs.existsSync(candidatesDir)) {
    return [];
  }

  return fs
    .readdirSync(candidatesDir)
    .map((candidateId) => {
      const metadataPath = path.join(candidatesDir, candidateId, "metadata.json");
      const metadata = readJson(metadataPath);
      return {
        candidateId,
        status: metadata?.status || "unknown",
        taskId: metadata?.taskId || "unknown",
        approvalRequired: metadata?.approvalRequired === true
      };
    })
    .sort((a, b) => a.candidateId.localeCompare(b.candidateId))
    .slice(-10)
    .map(
      (candidate) =>
        `${candidate.candidateId} | task=${candidate.taskId} | status=${candidate.status} | approval=${candidate.approvalRequired}`
    );
}

function main() {
  const gatewayState = syncGatewayState("status-console");
  const gitStatus = safeExec("git status --short") || "clean";
  const gitLog = safeExec("git log --oneline -5");

  const roadmap = getRoadmapSummary();

  const overnightLogs = latestFiles(
    path.join(root, "founder-command-center", "runtime", "overnight"),
    5
  );

  const buildReports = latestFiles(
    path.join(root, "founder-command-center", "build-system", "reports"),
    5
  );

  const patchCandidates = getPatchCandidates();

  const activeGods = getCanonicalOlympusAgents().map(
    (agent) => `${agent.name}: ${agent.title}`
  );

  const designedNextGods = getAgentsByOperationalStatus("DESIGNED_NEXT")
    .filter((agent) => agent.canonicalStatus === "classical_12")
    .map((agent) => `${agent.name}: ${agent.title}`);

  const absorbedFunctions = Object.values(olympusAgents)
    .filter((agent) => agent.canonicalStatus === "internal_absorbed")
    .map((agent) => `${agent.name}: ${agent.title}`);

  const capabilityStatuses = countBy(
    Object.values(zeusCapabilities).map((capability) => capability.status)
  );
  const recentEvents = readRecentEvents(8).map(
    (event) => `${event.at} | ${event.source} | ${event.type} | ${event.summary}`
  );

  const cleanRoomRefs = latestFiles(
    path.join(
      root,
      "founder-command-center",
      "intelligence",
      "external-references",
      "extracted"
    ),
    5
  );

  console.log("ZEUS COMMAND CENTER");
  console.log("");
  console.log("Miguel: Supreme Tribunal");
  console.log("ZEUS: Sovereign judge-orchestrator");
  console.log("Mode: DELIBERATION_ONLY / APPROVAL_GATED");

  printHeader("CONTROL PLANE");
  console.log(`Updated at: ${gatewayState.updatedAt}`);
  console.log(`Main session: ${gatewayState.session.mainSession}`);
  console.log(`Current focus: ${gatewayState.session.currentFocus}`);
  console.log(`Latest build report: ${gatewayState.build.latestReportStatus || "unknown"}`);
  console.log(`Hermes drafts: ${gatewayState.hermes.draftCount}`);
  console.log(`Hermes approvals: ${gatewayState.hermes.approvalCount}`);
  console.log(`Recent events: ${gatewayState.controlPlane.eventCount}`);
  console.log(`Latest doctor: ${gatewayState.controlPlane.latestDoctorReport || "none"}`);
  console.log(`Next action: ${gatewayState.nextRecommendedAction}`);

  printHeader("GIT");
  console.log(gitStatus);
  console.log("");
  console.log(gitLog || "No git log available.");

  printHeader("ROADMAP QUEUE");
  if (!roadmap.exists) {
    console.log("No roadmapQueueState.json found.");
  } else {
    console.log("Status counts:");
    console.log(JSON.stringify(roadmap.counts, null, 2));
    console.log("");
    console.log("Latest tasks:");
    printList(roadmap.latest);
  }

  printHeader("PATCH CANDIDATES");
  printList(patchCandidates, "no patch candidates");

  printHeader("LATEST OVERNIGHT LOGS");
  printList(overnightLogs, "no overnight logs");

  printHeader("LATEST BUILD REPORTS");
  printList(buildReports, "no build reports");

  printHeader("RECENT EVENTS");
  printList(recentEvents, "no recent events");

  printHeader("OLYMPUS");
  console.log("Classical layer active now:");
  printList(activeGods);
  console.log("");
  console.log("Classical layer designed next:");
  printList(designedNextGods);
  console.log("");
  console.log("Internal absorbed functions:");
  printList(absorbedFunctions);

  printHeader("ZEUS CAPABILITIES");
  console.log(JSON.stringify(capabilityStatuses, null, 2));

  printHeader("CLEAN-ROOM EXTERNAL PATTERNS");
  printList(cleanRoomRefs, "no clean-room references");

  printHeader("NEXT RECOMMENDED ACTION");
  if (gitStatus !== "clean") {
    console.log("Block execution. Review working tree before running overnight or applying candidates.");
  } else if (patchCandidates.some((candidate) => candidate.includes("waiting_review"))) {
    console.log("Review pending patch candidates before creating new apply actions.");
  } else {
    console.log("Integrate roadmap classifier dry-run into routing, then prepare ZEUS watch mode.");
  }

  console.log("");
}

main();
