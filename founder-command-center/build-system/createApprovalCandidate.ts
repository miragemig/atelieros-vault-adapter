import fs from "fs";
import path from "path";

const root = process.cwd();

const reportsPath = path.join(
  root,
  "founder-command-center/build-system/reports"
);

const candidatesPath = path.join(
  root,
  "founder-command-center/build-system/approval-candidates"
);

type BuildReport = {
  id: string;
  createdAt: string;
  status: "pass" | "fail";
  taskId: string;
  taskTitle: string;
  coreDestinationPath?: string;
  finalCandidatePath?: string;
};

function getLatestPassingReportPath(): string {
  if (!fs.existsSync(reportsPath)) {
    throw new Error(`Reports folder not found: ${reportsPath}`);
  }

  const reports = fs
    .readdirSync(reportsPath)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(reportsPath, file);
      const stat = fs.statSync(fullPath);
      return { file, fullPath, time: stat.mtimeMs };
    })
    .sort((a, b) => b.time - a.time);

  for (const report of reports) {
    const parsed = JSON.parse(fs.readFileSync(report.fullPath, "utf-8")) as BuildReport;

    if (parsed.status === "pass" && parsed.finalCandidatePath) {
      return report.fullPath;
    }
  }

  throw new Error("No passing build report with finalCandidatePath found.");
}

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function createApprovalCandidate() {
  const reportPath = getLatestPassingReportPath();
  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8")) as BuildReport;

  if (!report.finalCandidatePath) {
    throw new Error("Passing report does not include finalCandidatePath.");
  }

  if (!fs.existsSync(report.finalCandidatePath)) {
    throw new Error(`Final candidate file not found: ${report.finalCandidatePath}`);
  }

  fs.mkdirSync(candidatesPath, { recursive: true });

  const candidateId = `${safeFileName(report.taskId)}-${report.id}`;
  const candidateCodePath = path.join(candidatesPath, `${candidateId}.candidate.ts`);
  const candidateMetaPath = path.join(candidatesPath, `${candidateId}.metadata.json`);

  fs.copyFileSync(report.finalCandidatePath, candidateCodePath);

  const metadata = {
    candidateId,
    createdAt: new Date().toISOString(),
    taskId: report.taskId,
    taskTitle: report.taskTitle,
    coreDestinationPath: report.coreDestinationPath || null,
    sourceReportPath: reportPath,
    sourceCandidatePath: report.finalCandidatePath,
    candidateCodePath,
    requiresHumanApproval: true,
    approved: false,
    appliedToCore: false
  };

  fs.writeFileSync(candidateMetaPath, JSON.stringify(metadata, null, 2), "utf-8");

  console.log(`Approval candidate created: ${candidateCodePath}`);
  console.log(`Metadata created: ${candidateMetaPath}`);
}

createApprovalCandidate();
