import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = "G:\\ZEUS";
const VAULT_PATH = process.env.ZEUS_VAULT_PATH || "G:\\ZEUS-VAULT";
const MODEL = process.env.ZEUS_LOCAL_MODEL || "llama3.2:3b";
const question = process.argv.slice(2).join(" ");

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...collectMarkdownFiles(full));
    } else if (entry.isFile() && full.toLowerCase().endsWith(".md")) {
      out.push(full);
    }
  }

  return out;
}

function buildKeywords(query: string): string[] {
  const normalized = query.trim();

  const explicitConcepts = [
    "ZEUS Runtime",
    "Hestia",
    "Olympus",
    "Athena",
    "Ares",
    "Themis",
    "Hephaestus",
    "Hermes",
    "Runtime Governance",
    "Provider Layer",
    "Retrieval Layer",
    "Skill Registry",
    "Execution Policy",
    "SAFE_OVERNIGHT_MODE"
  ];

  const foundConcepts = explicitConcepts.filter(c =>
    normalized.toLowerCase().includes(c.toLowerCase())
  );

  const tokens = normalized
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 3)
    .filter(t => !["qual", "papel", "explica", "runtime"].includes(t.toLowerCase()));

  return [...new Set([normalized, ...foundConcepts, ...tokens])];
}

function retrieveContext(query: string): string {
  const files = collectMarkdownFiles(VAULT_PATH);
  const matches: string[] = [];
  const keywords = buildKeywords(query);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      const lowerFile = file.toLowerCase();

      const hit = keywords.some(k => {
        const kk = k.toLowerCase();
        return lowerLine.includes(kk) || lowerFile.includes(kk);
      });

      if (hit) {
        matches.push([
          `FILE: ${file}`,
          `LINE: ${index + 1}`,
          `TEXT: ${line}`
        ].join("\n"));
      }
    });
  }

  return matches.slice(0, 40).join("\n\n");
}

function runOllama(prompt: string): string {
  const result = spawnSync("ollama", ["run", MODEL, prompt], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";

  if (result.error) {
    return `OLLAMA ERROR: ${result.error.message}`;
  }

  if (result.status !== 0) {
    return [
      `OLLAMA EXIT CODE: ${result.status}`,
      stderr || "(no stderr)",
      stdout || "(no stdout)"
    ].join("\n");
  }

  return stdout.trim() || stderr.trim() || "(empty ollama response)";
}

function main() {
  if (!question) {
    console.log('Usage: npm run zeus:ask-local "question"');
    process.exit(1);
  }

  const context = retrieveContext(question);

  const prompt = `
Responde em português europeu.

És o ZEUS Runtime local do Miguel.

REGRAS:
- Não inventes.
- Se o contexto do Vault existir, ele tem prioridade absoluta.
- Não uses conhecimento genérico sobre projetos chamados Zeus.
- Se o contexto for insuficiente, diz explicitamente: "Contexto insuficiente no Vault."
- Responde de forma curta, direta e operacional.
- Usa bullets quando ajudar.

CONTEXTO DO VAULT:
${context || "(sem contexto encontrado)"}

PERGUNTA:
${question}

RESPOSTA:
`;

  console.log("ZEUS ASK LOCAL");
  console.log(`Model: ${MODEL}`);
  console.log(`Vault: ${VAULT_PATH}`);
  console.log(`Context chars: ${context.length}`);
  console.log("");
  console.log("=== ANSWER ===");

  const answer = runOllama(prompt);
  console.log(answer);
}

main();
