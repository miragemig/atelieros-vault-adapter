import fs from "fs";
import path from "path";

const root = process.cwd();

const projectsRoot = path.join(
  root,
  "founder-command-center/projects/active"
);

export type ProjectType =
  | "website"
  | "marketing"
  | "software"
  | "automation"
  | "general";

export type CreateProjectInput = {
  projectId: string;
  projectType: ProjectType;
  approvedBy: string;
  sourceCommand: string;
};

function safeProjectId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function titleFromId(projectId: string): string {
  return projectId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function templateFor(projectType: ProjectType, projectId: string) {
  const title = titleFromId(projectId);

  const common = {
    PROJECT: [
      `# ${title}`,
      "",
      `Project ID: ${projectId}`,
      `Project type: ${projectType}`,
      `Status: ACTIVE`,
      "",
      "## Objective",
      "",
      "To be defined.",
      "",
      "## Current Phase",
      "",
      "Project intake.",
      ""
    ].join("\n"),

    DECISIONS: [
      `# Decisions — ${title}`,
      "",
      "## Decision Log",
      "",
      "- Project created after explicit Miguel approval.",
      ""
    ].join("\n"),

    RISKS: [
      `# Risks — ${title}`,
      "",
      "## Initial Risks",
      "",
      "- Objective not yet fully defined.",
      "- Scope may expand if not controlled.",
      "- Execution before strategy must be blocked.",
      ""
    ].join("\n"),

    TASKS: [
      `# Tasks — ${title}`,
      "",
      "## Open Tasks",
      "",
      "- Define objective.",
      "- Define target audience.",
      "- Define success metric.",
      "- Create first brief.",
      ""
    ].join("\n"),

    ROADMAP: [
      `# Roadmap — ${title}`,
      "",
      "## Phase 1 — Intake",
      "",
      "- Define objective.",
      "- Define constraints.",
      "- Define outputs.",
      "",
      "## Phase 2 — Strategy",
      "",
      "- Create plan.",
      "- Review risks.",
      "- Get Miguel approval.",
      ""
    ].join("\n")
  };

  const briefByType: Record<ProjectType, string> = {
    website: [
      `# Brief — ${title}`,
      "",
      "## Website Brief",
      "",
      "## Purpose",
      "",
      "What is this website supposed to achieve?",
      "",
      "## Audience",
      "",
      "Who is this website for?",
      "",
      "## Offer",
      "",
      "What is being offered?",
      "",
      "## Conversion Goal",
      "",
      "What should the visitor do?",
      "",
      "## Required Sections",
      "",
      "- Hero",
      "- Problem / Need",
      "- Services / Offer",
      "- Proof / Credibility",
      "- Call to Action",
      ""
    ].join("\n"),

    marketing: [
      `# Brief — ${title}`,
      "",
      "## Marketing Brief",
      "",
      "## Product / Service",
      "",
      "To be defined.",
      "",
      "## Audience",
      "",
      "To be defined.",
      "",
      "## Promise",
      "",
      "To be defined.",
      "",
      "## Channels",
      "",
      "To be defined.",
      ""
    ].join("\n"),

    software: [
      `# Brief — ${title}`,
      "",
      "## Software Brief",
      "",
      "## Problem",
      "",
      "To be defined.",
      "",
      "## User",
      "",
      "To be defined.",
      "",
      "## MVP",
      "",
      "To be defined.",
      "",
      "## Functional Tests Required",
      "",
      "- Every generated module must include a functional test command.",
      ""
    ].join("\n"),

    automation: [
      `# Brief — ${title}`,
      "",
      "## Automation Brief",
      "",
      "## Current Process",
      "",
      "To be mapped.",
      "",
      "## Inputs",
      "",
      "To be defined.",
      "",
      "## Outputs",
      "",
      "To be defined.",
      "",
      "## Risks",
      "",
      "To be defined.",
      ""
    ].join("\n"),

    general: [
      `# Brief — ${title}`,
      "",
      "## General Project Brief",
      "",
      "To be defined.",
      ""
    ].join("\n")
  };

  return {
    ...common,
    BRIEF: briefByType[projectType]
  };
}

export function createProjectFromApproval(input: CreateProjectInput) {
  const projectId = safeProjectId(input.projectId);

  if (!projectId) {
    throw new Error("Invalid projectId.");
  }

  const projectPath = path.join(projectsRoot, projectId);

  if (fs.existsSync(projectPath)) {
    throw new Error(`Project already exists: ${projectPath}`);
  }

  fs.mkdirSync(projectPath, { recursive: true });
  fs.mkdirSync(path.join(projectPath, "drafts"), { recursive: true });
  fs.mkdirSync(path.join(projectPath, "outputs"), { recursive: true });
  fs.mkdirSync(path.join(projectPath, "sources"), { recursive: true });

  const templates = templateFor(input.projectType, projectId);

  fs.writeFileSync(path.join(projectPath, "PROJECT.md"), templates.PROJECT, "utf-8");
  fs.writeFileSync(path.join(projectPath, "BRIEF.md"), templates.BRIEF, "utf-8");
  fs.writeFileSync(path.join(projectPath, "ROADMAP.md"), templates.ROADMAP, "utf-8");
  fs.writeFileSync(path.join(projectPath, "RISKS.md"), templates.RISKS, "utf-8");
  fs.writeFileSync(path.join(projectPath, "DECISIONS.md"), templates.DECISIONS, "utf-8");
  fs.writeFileSync(path.join(projectPath, "TASKS.md"), templates.TASKS, "utf-8");

  const metadata = {
    projectId,
    projectType: input.projectType,
    createdAt: new Date().toISOString(),
    approvedBy: input.approvedBy,
    approvalMode: "manual-explicit-cli",
    sourceCommand: input.sourceCommand,
    status: "ACTIVE"
  };

  fs.writeFileSync(
    path.join(projectPath, "metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf-8"
  );

  return projectPath;
}
