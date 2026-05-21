import fs from "fs";
import path from "path";
import { routeIntent } from "./zeusIntentRouter";
import { createZeusResponse } from "./zeusAdvisor";
import { createZeusOllamaResponse } from "./zeusOllamaAdvisor";

const root = process.cwd();

const proposalsPath = path.join(
  root,
  "founder-command-center/chat/proposals"
);

function getCliInput(): { message: string; useOllama: boolean } {
  const args = process.argv.slice(2);
  const useOllama = args.includes("--ollama");
  const message = args.filter((arg) => arg !== "--ollama").join(" ").trim();

  if (!message) {
    throw new Error('Usage: npx tsx founder-command-center\\chat\\zeusChatCli.ts [--ollama] "Zeus, o que queres fazer?"');
  }

  return { message, useOllama };
}

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function saveProposal(message: string, response: string) {
  fs.mkdirSync(proposalsPath, { recursive: true });

  const id = `${Date.now()}-${safeFileName(message)}`;
  const filePath = path.join(proposalsPath, `${id}.md`);

  const content = [
    `# ZEUS Proposal — ${id}`,
    "",
    "## Miguel",
    "",
    message,
    "",
    "## ZEUS",
    "",
    response,
    ""
  ].join("\n");

  fs.writeFileSync(filePath, content, "utf-8");

  return filePath;
}

async function main() {
  const { message, useOllama } = getCliInput();
  const routed = routeIntent(message);

  const response = useOllama
    ? await createZeusOllamaResponse(message, routed)
    : createZeusResponse(message, routed);

  const proposalPath = saveProposal(message, response);

  console.log(response);
  console.log("");
  console.log(`Proposal saved: ${proposalPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
