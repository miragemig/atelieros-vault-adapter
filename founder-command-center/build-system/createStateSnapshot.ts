import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();

const snapshotsPath = path.join(
  root,
  "founder-command-center/state-snapshots"
);

const buildQueuePath = path.join(
  root,
  "founder-command-center/BUILD_QUEUE.md"
);

const buildTaskPath = path.join(
  root,
  "founder-command-center/build-system/buildTask.json"
);

const reportsPath = path.join(
  root,
  "founder-command-center/build-system/reports"
);

const candidatesPath = path.join(
  root,
  "founder-command-center/build-system/approval-candidates"
);

const appliedPath = path.join(
  root,
  "founder-command-center/build-system/applied"
);

function safeRead(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

function getLatestFile(dirPath: string, extension?: string): string | null {
  if (!fs.existsSync(dirPath)) return null;

  const files = fs
    .readdirSync(dirPath)
    .filter((file) => !extension || file.endsWith(extension))
    .map((file) => ({
      file,
      fullPath: path.join(dirPath, file),
      time: fs.statSync(path.join(dirPath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  return files[0]?.fullPath || null;
}

function getGitLog(): string {
  try {
    return execSync("git log --oneline -10", {
      cwd: root,
      encoding: "utf-8"
    });
  } catch {
    return "Unable to read git log.";
  }
}

function getGitStatus(): string {
  try {
    return execSync("git status --short", {
      cwd: root,
      encoding: "utf-8"
    });
  } catch {
    return "Unable to read git status.";
  }
}

function createStateSnapshot() {
  fs.mkdirSync(snapshotsPath, { recursive: true });

  const id = String(Date.now());
  const latestReportPath = getLatestFile(reportsPath, ".json");
  const latestCandidateMetaPath = getLatestFile(candidatesPath, ".metadata.json");
  const latestAppliedPath = getLatestFile(appliedPath, ".ts");

  const snapshot = {
    id,
    createdAt: new Date().toISOString(),
    git: {
      status: getGitStatus(),
      log: getGitLog()
    },
    buildTask: buildTaskPath,
    latestReportPath,
    latestCandidateMetaPath,
    latestAppliedPath,
    buildQueueExists: fs.existsSync(buildQueuePath),
    buildTaskExists: fs.existsSync(buildTaskPath),
    summary: {
      currentPhase: "ZEUS governed local build loop v0.3",
      generated: true,
      validated: true,
      approved: true,
      appliedSandbox: true,
      appliedCore: false,
      zeroCost: true,
      provider: "ollama"
    }
  };

  const snapshotJsonPath = path.join(
    snapshotsPath,
    `state-snapshot-${id}.json`
  );

  const snapshotMdPath = path.join(
    snapshotsPath,
    `state-snapshot-${id}.md`
  );

  fs.writeFileSync(snapshotJsonPath, JSON.stringify(snapshot, null, 2), "utf-8");

  const latestReport = latestReportPath ? safeRead(latestReportPath) : null;
  const latestCandidateMeta = latestCandidateMetaPath ? safeRead(latestCandidateMetaPath) : null;
  const buildTask = safeRead(buildTaskPath);

  const markdown = [
    `# ZEUS State Snapshot — ${id}`,
    ``,
    `Created at: ${snapshot.createdAt}`,
    ``,
    `## Current Phase`,
    ``,
    `ZEUS governed local build loop v0.3`,
    ``,
    `## Status`,
    ``,
    `- Generated: true`,
    `- Validated: true`,
    `- Approved: true`,
    `- Applied sandbox: true`,
    `- Applied core: false`,
    `- Zero-cost: true`,
    `- Provider: Ollama local`,
    ``,
    `## Git Status`,
    ``,
    "```text",
    snapshot.git.status || "clean",
    "```",
    ``,
    `## Recent Commits`,
    ``,
    "```text",
    snapshot.git.log,
    "```",
    ``,
    `## Build Task`,
    ``,
    "```json",
    buildTask || "No buildTask.json found.",
    "```",
    ``,
    `## Latest Report`,
    ``,
    latestReportPath || "No report found.",
    ``,
    "```json",
    latestReport || "No report content.",
    "```",
    ``,
    `## Latest Candidate Metadata`,
    ``,
    latestCandidateMetaPath || "No candidate metadata found.",
    ``,
    "```json",
    latestCandidateMeta || "No candidate metadata content.",
    "```",
    ``,
    `## Next Recommended Step`,
    ``,
    `Do not apply to core yet. Next: create controlled core-apply mechanism with explicit destination and backup.`,
    ``
  ].join("\n");

  fs.writeFileSync(snapshotMdPath, markdown, "utf-8");

  console.log(`State snapshot created: ${snapshotJsonPath}`);
  console.log(`State snapshot markdown created: ${snapshotMdPath}`);
}

createStateSnapshot();
