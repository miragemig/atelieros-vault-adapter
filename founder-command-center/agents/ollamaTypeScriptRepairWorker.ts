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
  "founder-command-center/logs/ollama-typescript-repair-worker.log"
);

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, line, "utf-8");
  console.log(message);
}

function getLatestCleanFile(): string {
  const files = fs
    .readdirSync(quarantinePath)
    .filter((file) => file.endsWith(".clean.ts"))
    .map((file) => ({
      file,
      time: fs.statSync(path.join(quarantinePath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    throw new Error("No clean TypeScript files found in quarantine.");
  }

  return path.join(quarantinePath, files[0].file);
}

async function runTypeScriptRepairWorker() {
  const costDecision = assertZeroCost({
    provider: "ollama",
    mayGenerateCost: false
  });

  if (!costDecision.allowed) {
    throw new Error(costDecision.reason);
  }

  const inputPath = getLatestCleanFile();
  const currentCode = fs.readFileSync(inputPath, "utf-8");
  const model = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";

  const compilerError = `
TypeScript compiler error:

Line 36:
return Array.from(new Set(normalizeEntityName(input) for input in inputs));

Errors:
- TS1005: ',' expected.
- TS1005: '(' expected.
- TS1109: Expression expected.

Cause:
The code uses Python-style generator syntax. This is invalid in TypeScript.

Required fix:
Use valid TypeScript array mapping, for example:
return Array.from(new Set(inputs.map((input) => normalizeEntityName(input))));
`;

  const system = [
    "You are a strict TypeScript repair worker.",
    "Rules:",
    "- return TypeScript code only",
    "- no markdown fences",
    "- no prose",
    "- no console.log",
    "- no external imports",
    "- no filesystem access",
    "- no Python syntax",
    "- code must compile with tsc"
  ].join("\n");

  const prompt = [
    "Repair this TypeScript module so it compiles.",
    "",
    compilerError,
    "",
    "Functional requirements:",
    "- normalizeEntityName('Moradia_Moradia_Boavista') returns 'Moradia_Boavista'",
    "- detectSuspiciousEntityName('Moradia_Moradia_Boavista') returns true",
    "- detectSuspiciousEntityName('Moradia_Boavista') returns false",
    "- deduplicateEntityNames(['Moradia_Moradia_Boavista', 'Moradia_Boavista']) returns ['Moradia_Boavista']",
    "",
    "Return only the complete corrected TypeScript code.",
    "",
    currentCode
  ].join("\n");

  log(`Starting TypeScript repair worker with model: ${model}`);
  log(`Input: ${inputPath}`);

  const repaired = await generateWithOllama({
    model,
    system,
    prompt
  });

  const outputPath = inputPath.replace(/\.clean\.ts$/, `.tsrepair.${Date.now()}.draft.ts`);
  fs.writeFileSync(outputPath, repaired.trim(), "utf-8");

  log(`Generated TypeScript repaired draft: ${outputPath}`);
}

runTypeScriptRepairWorker().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  log(`TypeScript repair worker failed: ${message}`);
  process.exit(1);
});
