import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();

const refreshSeconds = Number(process.argv[2] || 15);

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

function latestFile(dirPath: string): string | null {
  if (!fs.existsSync(dirPath)) return null;

  const files = fs
    .readdirSync(dirPath)
    .map((file) => ({
      file,
      fullPath: path.join(dirPath, file),
      time: fs.statSync(path.join(dirPath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  return files[0]?.file || null;
}

function countRoadmapStatuses(): Record<string, number> {
  const queuePath = path.join(
    root,
    "founder-command-center",
    "runtime",
    "roadmapQueueState.json"
  );

  const queue = readJson(queuePath);

  if (!queue?.tasks) {
    return {};
  }

  return queue.tasks.reduce((acc: Record<string, number>, task: any) => {
    const status = task.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

function countPatchCandidates(): Record<string, number> {
  const candidatesDir = path.join(
    root,
    "founder-command-center",
    "patch-system",
    "patch-candidates"
  );

  if (!fs.existsSync(candidatesDir)) {
    return {};
  }

  return fs.readdirSync(candidatesDir).reduce((acc: Record<string, number>, candidateId) => {
    const metadataPath = path.join(candidatesDir, candidateId, "metadata.json");
    const metadata = readJson(metadataPath);
    const status = metadata?.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

function getNextRecommendation(gitStatus: string, patchCounts: Record<string, number>): string {
  if (gitStatus !== "clean") {
    return "BLOCKED: working tree is not clean. Review Git state before execution.";
  }

  if ((patchCounts["waiting_review"] || 0) > 0) {
    return "ACTION: review pending patch candidates before creating new apply actions.";
  }

  return "READY: observe roadmap classifier logs or prepare next approved task.";
}

function clearScreen() {
  process.stdout.write("\x1Bc");
}

function render() {
  const gitStatus = safeExec("git status --short") || "clean";
  const latestCommit = safeExec("git log --oneline -1") || "unknown";

  const roadmapCounts = countRoadmapStatuses();
  const patchCounts = countPatchCandidates();

  const latestOvernight = latestFile(
    path.join(root, "founder-command-center", "runtime", "overnight")
  );

  const latestBuildReport = latestFile(
    path.join(root, "founder-command-center", "build-system", "reports")
  );

  clearScreen();

  console.log("ZEUS WATCH MODE");
  console.log("=".repeat(72));
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`Refresh: ${refreshSeconds}s`);
  console.log("");
  console.log("Miguel: Supreme Tribunal");
  console.log("ZEUS: active observer / approval-gated operator");
  console.log("Mode: WATCH_ONLY / NO_CRITICAL_ACTIONS");
  console.log("");

  console.log("GIT");
  console.log("-".repeat(72));
  console.log(`Status: ${gitStatus === "clean" ? "clean" : "dirty"}`);
  if (gitStatus !== "clean") {
    console.log(gitStatus);
  }
  console.log(`Latest commit: ${latestCommit}`);
  console.log("");

  console.log("ROADMAP");
  console.log("-".repeat(72));
  console.log(JSON.stringify(roadmapCounts, null, 2));
  console.log("");

  console.log("PATCH CANDIDATES");
  console.log("-".repeat(72));
  console.log(JSON.stringify(patchCounts, null, 2));
  console.log("");

  console.log("LATEST SIGNALS");
  console.log("-".repeat(72));
  console.log(`Latest overnight log: ${latestOvernight || "none"}`);
  console.log(`Latest build report: ${latestBuildReport || "none"}`);
  console.log("");

  console.log("THEMIS");
  console.log("-".repeat(72));
  console.log("Critical actions blocked by default:");
  console.log("- core apply");
  console.log("- git commit/push");
  console.log("- email send");
  console.log("- paid API");
  console.log("- browser/computer control");
  console.log("");

  console.log("NEXT RECOMMENDED ACTION");
  console.log("-".repeat(72));
  console.log(getNextRecommendation(gitStatus, patchCounts));
  console.log("");
  console.log("Press Ctrl+C to stop ZEUS Watch.");
}

function main() {
  render();

  setInterval(() => {
    render();
  }, refreshSeconds * 1000);
}

main();
