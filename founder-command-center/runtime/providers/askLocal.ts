import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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

function retrieveContext(query: string): string {
  const q = query.toLowerCase();
  const files = collectMarkdownFiles(VAULT_PATH);
  const matches: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (
        line.toLowerCase().includes(q) ||
        file.toLowerCase().includes(q) ||
        question.toLowerCase().split(/\s+/).some(token =>
          token.length > 4 && line.toLowerCase().includes(token)
        )
      ) {
        matches.push([
          `FILE: ${file}`,
          `LINE: ${index + 1}`,
          `TEXT: ${line}`
        ].join("\n"));
      }
    });
  }

  return matches.slice(0, 20).join("\n\n");
}

function runOllama(prompt: string): string {
  const safePrompt = prompt.replace(/"/g, '\\"');

  return execSync(`ollama run ${MODEL} "${safePrompt}"`, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 1024 * 1024 * 10
  });
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
Não inventes.
Usa apenas o CONTEXTO DO VAULT quando relevante.
Se o contexto for insuficiente, diz isso claramente.
Não confundas este ZEUS Runtime com projetos externos chamados Zeus.

CONTEXTO:
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

  const answer = runOllama(prompt);

  console.log(answer);
}

main();
