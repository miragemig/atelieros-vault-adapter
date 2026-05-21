import fs from "fs";
import path from "path";
import { generateWithOllama } from "../providers/ollamaProvider";
import { assertZeroCost } from "../governance/zeroCostGuard";

const quarantinePath = path.join(
  process.cwd(),
  "founder-command-center/build-system/quarantine"
);

const logPath = path.join(
  process.cwd(),
  "founder-command-center/logs/ollama-repair-worker.log"
);

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, line, "utf-8");
  console.log(message);
}

function getLatestCleanOrDraft(): string {
  const files = fs
    .readdirSync(quarantinePath)
    .filter((file) => file.endsWith(".clean.ts") || file.endsWith(".draft.ts"))
    .map((file) => ({
      file,
      time: fs.statSync(path.join(quarantinePath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    throw new Error("No clean/draft files found in quarantine.");
  }

  return path.join(quarantinePath, files[0].file);
}

async function runRepairWorker() {
  const costDecision = assertZeroCost({
    provider: "ollama",
    mayGenerateCost: false
  });

  if (!costDecision.allowed) {
    throw new Error(costDecision.reason);
  }

  const inputPath = getLatestCleanOrDraft();
  const currentCode = fs.readFileSync(inputPath, "utf-8");
  const model = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";

  const system = [
    "You are a local ZEUS code repair worker.",
    "Rules:",
    "- zero additional cost",
    "- use only local Ollama",
    "- return TypeScript code only",
    "- no markdown code fences",
    "- no console.log",
    "- no external dependencies",
    "- no filesystem writes",
    "- fix logic errors precisely"
  ].join("\n");

  const prompt = [
    "Repair this TypeScript module.",
    "",
    "Validation failed for these reasons:",
    "- It contains console.log examples.",
    "- detectSuspiciousEntityName uses flawed logic for repeated tokens.",
    "- It must detect partial token repetition such as Moradia_Moradia_Boavista.",
    "",
    "Expected behavior:",
    "- normalizeEntityName('Moradia_Moradia_Boavista') returns 'Moradia_Boavista'",
    "- detectSuspiciousEntityName('Moradia_Moradia_Boavista') returns true",
    "- detectSuspiciousEntityName('Moradia_Boavista') returns false",
    "- deduplicateEntityNames removes duplicates after normalization",
    "",
    "Return only corrected TypeScript code.",
    "",
    "Current code:",
    currentCode
  ].join("\n");

  log(`Starting repair worker with model: ${model}`);
  log(`Input: ${inputPath}`);

  const repaired = await generateWithOllama({
    model,
    system,
    prompt
  });

  const outputPath = inputPath.replace(/(\.clean|\.draft)?\.ts$/, `.repaired.${Date.now()}.draft.ts`);
  fs.writeFileSync(outputPath, repaired.trim(), "utf-8");

  log(`Generated repaired draft: ${outputPath}`);
}

runRepairWorker().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  log(`Repair worker failed: ${message}`);
  process.exit(1);
});
