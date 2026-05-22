import fs from "fs";
import path from "path";
import { generateWithOllama } from "../providers/ollamaProvider";
import { assertZeroCost } from "../governance/zeroCostGuard";

type BuildTask = {
  id: string;
  title: string;
  model: string;
  provider: string;
  mayGenerateCost: boolean;
  maxAttempts: number;
  requirements: string[];
  context?: string;
};

const root = process.cwd();

const taskPath = path.join(
  root,
  "founder-command-center/runtime/buildTask.json"
);

const quarantinePath = path.join(
  root,
  "founder-command-center/build-system/quarantine"
);

const logPath = path.join(
  root,
  "founder-command-center/logs/ollama-build-worker.log"
);

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, line, "utf-8");
  console.log(message);
}

function loadBuildTask(): BuildTask {
  if (!fs.existsSync(taskPath)) {
    throw new Error(`Build task not found: ${taskPath}`);
  }

  const task = JSON.parse(fs.readFileSync(taskPath, "utf-8")) as BuildTask;

  if (!task.id || !task.title || !task.model || !task.provider) {
    throw new Error("Invalid buildTask.json: id, title, model and provider are required.");
  }

  if (!Array.isArray(task.requirements) || task.requirements.length === 0) {
    throw new Error("Invalid buildTask.json: requirements must be a non-empty array.");
  }

  return task;
}

function createPrompt(task: BuildTask) {
  return [
    `Create a TypeScript draft module for: ${task.title}.`,
    "",
    "Context:",
    task.context || "ZEUS is a local-first, zero-cost command center. This draft must stay in quarantine until reviewed.",
    "",
    "Requirements:",
    ...task.requirements.map((requirement) => `- ${requirement}`),
    "- no filesystem writes",
    "- no external dependencies",
    "- no paid APIs",
    "- export all main functions",
    "- include comments only when useful",
    "",
    "Return only TypeScript code. Do not use markdown fences."
  ].join("\n");
}

async function runOllamaBuildWorker() {
  const task = loadBuildTask();

  const costDecision = assertZeroCost({
    provider: task.provider,
    mayGenerateCost: task.mayGenerateCost
  });

  if (!costDecision.allowed) {
    throw new Error(costDecision.reason);
  }

  fs.mkdirSync(quarantinePath, { recursive: true });

  const model = process.env.OLLAMA_MODEL || task.model;

  const system = [
    "You are a local ZEUS build worker.",
    "Rules:",
    "- zero additional cost",
    "- use only local Ollama",
    "- do not suggest paid APIs",
    "- do not modify real project files",
    "- generate code as a draft only",
    "- output TypeScript only",
    "- no markdown fences"
  ].join("\n");

  const prompt = createPrompt(task);

  log(`Starting Ollama build worker with model: ${model}`);
  log(`Task: ${task.id} — ${task.title}`);

  const output = await generateWithOllama({
    model,
    system,
    prompt
  });

  const fileName = `${safeFileName(task.id)}-${Date.now()}.draft.ts`;
  const outputPath = path.join(quarantinePath, fileName);

  fs.writeFileSync(outputPath, output.trim(), "utf-8");

  log(`Generated quarantine draft: ${outputPath}`);
}

runOllamaBuildWorker().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  log(`Ollama build worker failed: ${message}`);
  process.exit(1);
});
