import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { readGatewayState, readRecentEvents } from "../zeus/zeusControlPlane";

const root = process.cwd();

function safeExec(command: string): string {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf-8"
    }).trim();
  } catch {
    return "";
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

export function readOperationalContext() {
  const reportsPath = path.join(root, "founder-command-center/build-system/reports");
  const buildTaskPath = path.join(root, "founder-command-center/runtime/buildTask.json");

  const latestReportPath = latestFile(reportsPath, ".json");
  const latestReport = latestReportPath && fs.existsSync(latestReportPath)
    ? JSON.parse(fs.readFileSync(latestReportPath, "utf-8"))
    : null;

  const buildTask = fs.existsSync(buildTaskPath)
    ? JSON.parse(fs.readFileSync(buildTaskPath, "utf-8"))
    : null;

  return {
    gitStatus: safeExec("git status --short") || "clean",
    gitLog: safeExec("git log --oneline -5"),
    latestReport,
    latestReportPath,
    buildTask,
    gatewayState: readGatewayState(),
    recentEvents: readRecentEvents(5)
  };
}
