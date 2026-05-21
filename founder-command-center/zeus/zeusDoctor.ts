import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  appendEvent,
  readRecentEvents,
  syncGatewayState
} from "./zeusControlPlane";

const root = process.cwd();
const doctorDir = path.join(root, "founder-command-center", "logs", "doctor");

type CheckStatus = "pass" | "warn" | "fail";

type DoctorCheck = {
  id: string;
  status: CheckStatus;
  detail: string;
};

type DoctorReport = {
  system: "ZEUS";
  generatedAt: string;
  overallStatus: CheckStatus;
  checks: DoctorCheck[];
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

function exists(relPath: string) {
  return fs.existsSync(path.join(root, relPath));
}

function pushCheck(checks: DoctorCheck[], id: string, status: CheckStatus, detail: string) {
  checks.push({ id, status, detail });
}

function overallStatus(checks: DoctorCheck[]): CheckStatus {
  if (checks.some((check) => check.status === "fail")) return "fail";
  if (checks.some((check) => check.status === "warn")) return "warn";
  return "pass";
}

function buildChecks(): DoctorCheck[] {
  const checks: DoctorCheck[] = [];

  pushCheck(
    checks,
    "node",
    process.version ? "pass" : "fail",
    process.version ? `Node disponível: ${process.version}` : "Node indisponível."
  );

  const tsxAvailable =
    exists("node_modules/.bin/tsx") || exists("node_modules/.bin/tsx.cmd");
  pushCheck(
    checks,
    "tsx",
    tsxAvailable ? "pass" : "fail",
    tsxAvailable ? "tsx disponível no projeto." : "tsx não encontrado em node_modules/.bin."
  );

  const pythonVersion =
    safeExec("python --version") ||
    safeExec("py -3.12 --version") ||
    safeExec("py --version");
  pushCheck(
    checks,
    "python",
    pythonVersion ? "pass" : "fail",
    pythonVersion || "Python não encontrado no ambiente."
  );

  pushCheck(
    checks,
    "router",
    exists("founder-command-center/zeus/zeusCommandRouter.ts") ? "pass" : "fail",
    exists("founder-command-center/zeus/zeusCommandRouter.ts")
      ? "Router principal disponível."
      : "Router principal em falta."
  );

  pushCheck(
    checks,
    "ui-server",
    exists("founder-command-center/ui/zeusConsoleServer.ts") ? "pass" : "fail",
    exists("founder-command-center/ui/zeusConsoleServer.ts")
      ? "Servidor da UI disponível."
      : "Servidor da UI em falta."
  );

  pushCheck(
    checks,
    "ui-html",
    exists("founder-command-center/ui/zeus-console.html") ? "pass" : "fail",
    exists("founder-command-center/ui/zeus-console.html")
      ? "Interface HTML disponível."
      : "Interface HTML em falta."
  );

  const playwrightPython =
    safeExec("python -m playwright --version") ||
    safeExec("py -3.12 -m playwright --version");
  pushCheck(
    checks,
    "playwright-python",
    playwrightPython ? "pass" : "warn",
    playwrightPython || "Playwright Python não confirmou disponibilidade."
  );

  pushCheck(
    checks,
    "runtime-requirements",
    exists("founder-command-center/zeus-runtime/requirements.txt") ? "pass" : "fail",
    exists("founder-command-center/zeus-runtime/requirements.txt")
      ? "Requirements do runtime local disponíveis."
      : "Requirements do runtime local em falta."
  );

  const runtimeScripts = [
    "zeusOpenApp.py",
    "zeusFileControl.py",
    "zeusComputerControl.py",
    "zeusBrowserControl.py"
  ];
  const missingRuntimeScripts = runtimeScripts.filter(
    (file) => !exists(`founder-command-center/zeus-runtime/${file}`)
  );
  pushCheck(
    checks,
    "runtime-scripts",
    missingRuntimeScripts.length === 0 ? "pass" : "fail",
    missingRuntimeScripts.length === 0
      ? "Scripts centrais do runtime disponíveis."
      : `Scripts em falta: ${missingRuntimeScripts.join(", ")}`
  );

  pushCheck(
    checks,
    "logs-and-runtime",
    exists("founder-command-center/runtime") && exists("founder-command-center/logs")
      ? "pass"
      : "warn",
    exists("founder-command-center/runtime") && exists("founder-command-center/logs")
      ? "Pastas de runtime e logs disponíveis."
      : "Faltam pastas de runtime ou logs."
  );

  pushCheck(
    checks,
    "recent-events",
    readRecentEvents(1).length > 0 ? "pass" : "warn",
    readRecentEvents(1).length > 0
      ? "Já existe trilho recente de eventos."
      : "Ainda não existe trilho recente de eventos."
  );

  return checks;
}

function writeReport(report: DoctorReport) {
  fs.mkdirSync(doctorDir, { recursive: true });
  const reportPath = path.join(doctorDir, `doctor-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  return reportPath;
}

function printReport(report: DoctorReport, reportPath: string) {
  console.log("ZEUS DOCTOR");
  console.log("");
  console.log(`Overall status: ${report.overallStatus}`);
  console.log(`Generated at: ${report.generatedAt}`);
  console.log("");

  for (const check of report.checks) {
    console.log(`[${check.status.toUpperCase()}] ${check.id} - ${check.detail}`);
  }

  console.log("");
  console.log(`Report saved at: ${reportPath}`);
}

function main() {
  const checks = buildChecks();
  const report: DoctorReport = {
    system: "ZEUS",
    generatedAt: new Date().toISOString(),
    overallStatus: overallStatus(checks),
    checks
  };

  const reportPath = writeReport(report);
  syncGatewayState("doctor");
  appendEvent({
    source: "doctor",
    type: "doctor_ran",
    summary: `ZEUS doctor completed with status ${report.overallStatus}.`,
    data: {
      reportPath,
      overallStatus: report.overallStatus
    }
  });

  printReport(report, reportPath);
}

main();
