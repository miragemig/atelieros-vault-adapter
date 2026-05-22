import fs from "fs";
import path from "path";
import { generateWithOllama } from "../providers/ollamaProvider";
import { generateWithDeepSeek } from "../providers/deepseekProvider";
import { assertZeroCost } from "../governance/zeroCostGuard";
import { loadModelProviders } from "../providers/providerResolver";

type BuildTask = {
  id: string;
  title: string;
  model: string;
  provider: string;
  providerSpec?: string;
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

async function generate() {
  const task = loadBuildTask();

  const costDecision = assertZeroCost({
    provider: task.provider,
    mayGenerateCost: task.mayGenerateCost
  });

  if (!costDecision.allowed) {
    throw new Error(costDecision.reason);
  }

  fs.mkdirSync(quarantinePath, { recursive: true });

  // Resolve provider from task.providerSpec or use defaultLocal
  const providers = loadModelProviders();
  const providerSpec = task.providerSpec || providers.defaultLocal;
  const isCloudProvider = providerSpec.startsWith("deepseek:");

  const system = isCloudProvider
    ? [
        "You are a ZEUS build worker.",
        "Rules:",
        "- generate TypeScript code only",
        "- do not modify real project files",
        "- output code as a draft only",
        "- no markdown fences"
      ].join("\n")
    : [
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

  let output: string;

  if (isCloudProvider) {
    log(`Using DeepSeek provider (${providerSpec})`);
    log(`Task: ${task.id} — ${task.title}`);
    output = await generateWithDeepSeek({
      model: providerSpec,
      system,
      prompt
    });
  } else {
    const model = process.env.OLLAMA_MODEL || task.model;
    log(`Starting Ollama build worker with model: ${model}`);
    log(`Task: ${task.id} — ${task.title}`);
    output = await generateWithOllama({ model, system, prompt });
  }

  const fileName = `${safeFileName(task.id)}-${Date.now()}.draft.ts`;
  const outputPath = path.join(quarantinePath, fileName);

  fs.writeFileSync(outputPath, output.trim(), "utf-8");

  log(`Generated quarantine draft: ${outputPath}`);
}

generate().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  log(`Build worker failed: ${message}`);
  process.exit(1);
});
