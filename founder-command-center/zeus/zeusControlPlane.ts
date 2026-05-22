import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getCanonicalOlympusAgents } from "../olympus/agentRegistry";
import { redactData } from "./zeusRedact";

const root = process.cwd();
const runtimeDir = path.join(root, "founder-command-center", "runtime");
const logsDir = path.join(root, "founder-command-center", "logs");
const doctorLogsDir = path.join(logsDir, "doctor");
const gatewayStatePath = path.join(runtimeDir, "zeus-gateway-state.json");
const eventJournalPath = path.join(runtimeDir, "zeus-event-journal.jsonl");

export type ZeusEvent = {
  id: string;
  at: string;
  source: string;
  type: string;
  summary: string;
  data?: unknown;
};

export type ZeusGatewayState = {
  system: "ZEUS";
  version: string;
  updatedAt: string;
  mode: "DELIBERATION_ONLY" | "SAFE_AUTONOMOUS_BUILD";
  session: {
    mainSession: string;
    currentFocus: string;
  };
  git: {
    branch: string;
    status: string;
    clean: boolean;
  };
  build: {
    currentTask: string | null;
    latestReportStatus: string | null;
    latestReportPath: string | null;
  };
  hermes: {
    draftCount: number;
    approvalCount: number;
    sendGateCount: number;
    outboxCount: number;
  };
  runtime: {
    nodeVersion: string;
    pythonAvailable: boolean;
    tsxAvailable: boolean;
    uiHtmlAvailable: boolean;
    runtimeScriptsReady: boolean;
  };
  olympus: {
    activeClassical: string[];
  };
  controlPlane: {
    gatewayStatePath: string;
    eventJournalPath: string;
    eventCount: number;
    lastEventAt: string | null;
    latestDoctorReport: string | null;
  };
  nextRecommendedAction: string;
};

function safeExec(command: string): string {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh"
    }).trim();
  } catch {
    return "";
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureControlPlaneFiles() {
  ensureDir(runtimeDir);
  ensureDir(logsDir);
  ensureDir(doctorLogsDir);

  if (!fs.existsSync(eventJournalPath)) {
    fs.writeFileSync(eventJournalPath, "", "utf-8");
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

function latestFile(dirPath: string, extension: string): string | null {
  if (!fs.existsSync(dirPath)) return null;

  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(extension))
    .map((file) => ({
      file,
      fullPath: path.join(dirPath, file),
      time: fs.statSync(path.join(dirPath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  return files[0]?.fullPath || null;
}

function countFiles(dirPath: string, predicate?: (name: string) => boolean): number {
  if (!fs.existsSync(dirPath)) return 0;
  const items = fs.readdirSync(dirPath);
  return predicate ? items.filter(predicate).length : items.length;
}

export function readRecentEvents(limit = 10): ZeusEvent[] {
  ensureControlPlaneFiles();

  const content = fs.readFileSync(eventJournalPath, "utf-8").trim();
  if (!content) return [];

  return content
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as ZeusEvent;
      } catch {
        return null;
      }
    })
    .filter((event): event is ZeusEvent => Boolean(event))
    .slice(-limit)
    .reverse();
}

export function appendEvent(input: Omit<ZeusEvent, "id" | "at">) {
  ensureControlPlaneFiles();

  const event: ZeusEvent = {
    id: `evt-${Date.now()}`,
    at: new Date().toISOString(),
    source: input.source,
    type: input.type,
    summary: input.summary,
    data: input.data !== undefined ? redactData(input.data) : undefined
  };

  fs.appendFileSync(eventJournalPath, `${JSON.stringify(event)}\n`, "utf-8");
  return event;
}

function getGitState() {
  const branch = safeExec("git rev-parse --abbrev-ref HEAD") || "unknown";
  const status = safeExec("git status --short") || "clean";

  return {
    branch,
    status,
    clean: status === "clean"
  };
}

function getBuildState() {
  const buildTaskPath = path.join(
    root,
    "founder-command-center",
    "runtime",
    "buildTask.json"
  );
  const reportsDir = path.join(
    root,
    "founder-command-center",
    "build-system",
    "reports"
  );

  const buildTask = readJson(buildTaskPath);
  const latestReportPath = latestFile(reportsDir, ".json");
  const latestReport = latestReportPath ? readJson(latestReportPath) : null;

  return {
    currentTask: buildTask?.id || null,
    latestReportStatus: latestReport?.status || null,
    latestReportPath
  };
}

function getHermesState() {
  const hermesRoot = path.join(root, "founder-command-center", "hermes");

  return {
    draftCount: countFiles(path.join(hermesRoot, "drafts"), (name) => name.endsWith(".md")),
    approvalCount: countFiles(path.join(hermesRoot, "approvals"), (name) => name.endsWith(".json")),
    sendGateCount: countFiles(path.join(hermesRoot, "send-gates"), (name) => name.endsWith(".json")),
    outboxCount: countFiles(path.join(hermesRoot, "outbox"), (name) => name.endsWith(".json"))
  };
}

function getRuntimeState() {
  const pythonAvailable =
    Boolean(safeExec("python --version")) ||
    Boolean(safeExec("py -3.12 --version")) ||
    Boolean(safeExec("py --version"));

  const tsxAvailable = fs.existsSync(path.join(root, "node_modules", ".bin", "tsx")) ||
    fs.existsSync(path.join(root, "node_modules", ".bin", "tsx.cmd"));

  const uiHtmlAvailable = fs.existsSync(
    path.join(root, "founder-command-center", "ui", "zeus-console.html")
  );

  const runtimeScriptsReady = [
    "zeusOpenApp.py",
    "zeusFileControl.py",
    "zeusComputerControl.py",
    "zeusBrowserControl.py"
  ].every((file) =>
    fs.existsSync(path.join(root, "founder-command-center", "zeus-runtime", file))
  );

  return {
    nodeVersion: process.version,
    pythonAvailable,
    tsxAvailable,
    uiHtmlAvailable,
    runtimeScriptsReady
  };
}

function getLatestDoctorReportPath() {
  return latestFile(doctorLogsDir, ".json");
}

function getCurrentFocus(build: ZeusGatewayState["build"]) {
  if (build.currentTask) return build.currentTask;
  if (build.latestReportStatus) return `build-report:${build.latestReportStatus}`;
  return "zeus-core";
}

function getNextRecommendedAction(state: Omit<ZeusGatewayState, "nextRecommendedAction">) {
  if (!state.runtime.tsxAvailable) {
    return "Instalar dependências Node e validar o arranque do router.";
  }

  if (!state.runtime.pythonAvailable) {
    return "Validar Python e runtime local antes de abrir novas automações.";
  }

  if (!state.git.clean) {
    return "Rever alterações locais antes de executar ações adicionais.";
  }

  if (!state.controlPlane.latestDoctorReport) {
    return "Executar `zeus doctor` para fechar o diagnóstico base do sistema.";
  }

  if (!state.build.latestReportStatus || state.build.latestReportStatus === "fail") {
    return "Rever o último report de build e corrigir a próxima falha verificável.";
  }

  return "Consolidar o control plane e validar um fluxo completo de deliberação, preparação e aprovação.";
}

export function collectGatewayState(): ZeusGatewayState {
  ensureControlPlaneFiles();

  const git = getGitState();
  const build = getBuildState();
  const hermes = getHermesState();
  const runtime = getRuntimeState();
  const recentEvents = readRecentEvents(1);
  const latestDoctorReport = getLatestDoctorReportPath();

  // Preserve persisted mode — only default to DELIBERATION_ONLY if no state exists
  const existingState = readGatewayState();
  const persistedMode = existingState?.mode ?? "DELIBERATION_ONLY";

  const baseState = {
    system: "ZEUS" as const,
    version: "0.2",
    updatedAt: new Date().toISOString(),
    mode: persistedMode,
    session: {
      mainSession: "miguel-primary",
      currentFocus: getCurrentFocus(build)
    },
    git,
    build,
    hermes,
    runtime,
    olympus: {
      activeClassical: getCanonicalOlympusAgents().map((agent) => agent.name)
    },
    controlPlane: {
      gatewayStatePath,
      eventJournalPath,
      eventCount: readRecentEvents(1000000).length,
      lastEventAt: recentEvents[0]?.at || null,
      latestDoctorReport
    }
  };

  return {
    ...baseState,
    nextRecommendedAction: getNextRecommendedAction(baseState)
  };
}

export function writeGatewayState(state: ZeusGatewayState) {
  ensureControlPlaneFiles();
  fs.writeFileSync(gatewayStatePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
}

export function readGatewayState(): ZeusGatewayState | null {
  return readJson(gatewayStatePath);
}

export function syncGatewayState(source = "manual") {
  const state = collectGatewayState();
  writeGatewayState(state);
  appendEvent({
    source,
    type: "gateway_synced",
    summary: "Gateway state synchronized.",
    data: {
      currentFocus: state.session.currentFocus,
      latestReportStatus: state.build.latestReportStatus
    }
  });
  return state;
}

function printHumanStatus(state: ZeusGatewayState) {
  console.log("ZEUS CONTROL PLANE");
  console.log("");
  console.log(`Updated at: ${state.updatedAt}`);
  console.log(`Mode: ${state.mode}`);
  console.log(`Main session: ${state.session.mainSession}`);
  console.log(`Current focus: ${state.session.currentFocus}`);
  console.log(`Git: ${state.git.status}`);
  console.log(`Latest build report: ${state.build.latestReportStatus || "unknown"}`);
  console.log(`Recent events: ${state.controlPlane.eventCount}`);
  console.log(`Next action: ${state.nextRecommendedAction}`);
}

function main() {
  const command = process.argv[2] || "sync";

  switch (command) {
    case "sync": {
      const source = process.argv[3] || "manual";
      const state = syncGatewayState(source);
      printHumanStatus(state);
      return;
    }

    case "show": {
      const state = readGatewayState() || syncGatewayState("show-fallback");
      console.log(JSON.stringify(state, null, 2));
      return;
    }

    case "events": {
      const limit = Number(process.argv[3] || "10");
      console.log(JSON.stringify(readRecentEvents(limit), null, 2));
      return;
    }

    default:
      throw new Error(`Unknown ZEUS control plane command: ${command}`);
  }
}

if (require.main === module) {
  main();
}
