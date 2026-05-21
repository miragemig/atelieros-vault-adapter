import fs from "fs";
import path from "path";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";
import { readOperationalContext } from "../chat/zeusOperationalContext";

const root = process.cwd();

export type MnemosyneReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  continuityQuestion: string;
  knownState: string[];
  latestArtifacts: string[];
  recalledLessons: string[];
  suggestedMemoryNote: string;
};

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function latestFiles(dirPath: string, extension = "", limit = 5): string[] {
  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath)
    .filter((file) => (extension ? file.endsWith(extension) : true))
    .map((file) => ({
      file,
      fullPath: path.join(dirPath, file),
      time: fs.statSync(path.join(dirPath, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time)
    .slice(0, limit)
    .map((item) => item.file);
}

function readJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function recentRoadmapLessons(): string[] {
  const queuePath = path.join(
    root,
    "founder-command-center",
    "runtime",
    "roadmapQueueState.json"
  );
  const queue = readJson(queuePath);

  if (!queue?.tasks || !Array.isArray(queue.tasks)) {
    return ["Ainda não há lições formais suficientes no roadmap para consolidar padrão."];
  }

  const failed = queue.tasks.filter((task: any) => task.status === "failed");

  if (failed.length === 0) {
    return ["Não há falhas recentes registadas no roadmap."];
  }

  return failed.slice(0, 3).map((task: any) => {
    const title = task.title || task.id || "task";
    return `${title}: tentativa anterior falhou e deve informar a próxima abordagem.`;
  });
}

function hermesStateLines(): string[] {
  const statePath = path.join(
    root,
    "founder-command-center",
    "hermes",
    "state",
    "latest-draft-readback.json"
  );
  const state = readJson(statePath);

  if (!state) {
    return ["Hermes sem estado de readback recente registado."];
  }

  return [
    `Hermes estado atual: ${state.status || "unknown"}.`,
    `Último draft: ${path.basename(state.draftPath || "desconhecido")}.`,
    state.to ? `Destinatário preparado: ${state.to}.` : "Sem destinatário recente registado."
  ];
}

function proposalLines(): string[] {
  const proposalsDir = path.join(root, "founder-command-center", "chat", "proposals");
  const latest = latestFiles(proposalsDir, ".md", 3);

  if (latest.length === 0) {
    return ["Sem proposals recentes guardadas."];
  }

  return latest.map((file) => `Proposal recente: ${file}`);
}

function patchLines(): string[] {
  const candidatesDir = path.join(
    root,
    "founder-command-center",
    "patch-system",
    "patch-candidates"
  );
  const latest = latestFiles(candidatesDir, "", 3);

  if (latest.length === 0) {
    return ["Sem patch candidates recentes."];
  }

  return latest.map((file) => `Patch candidate recente: ${file}`);
}

function createReview(message: string, routed: RoutedIntent): MnemosyneReview {
  const context = readOperationalContext();
  const id = `${Date.now()}-${safeFileName(message)}`;

  let continuityQuestion =
    "Que contexto já existe e deve ser recuperado antes de abrir nova interpretação ou nova frente?";
  let recalledLessons = [
    "Valor sem continuidade perde-se entre decisões e tentativas.",
    "A mesma falha tende a repetir-se quando o sistema não a transforma em memória explícita."
  ];

  switch (routed.intent) {
    case "strategic_deliberation":
      continuityQuestion =
        "Que decisões e falhas recentes já apontam qual a próxima frente mais coerente?";
      recalledLessons = [
        "Deliberação sem memória repete debates já resolvidos.",
        "Se o roadmap recente falhou em várias tentativas, isso é sinal para abordagem mais estreita.",
        "Memória útil deve ligar decisão, tentativa e consequência."
      ];
      break;
    case "build_pipeline":
    case "software_project":
    case "automation_project":
      continuityQuestion =
        "Que fluxo anterior já falhou, e que restrições dessa falha devem ser preservadas agora?";
      recalledLessons = [
        "Falhas anteriores do pipeline são parte da especificação real.",
        "A próxima tentativa deve preservar o que já foi aprendido sobre gates e escopo.",
        "Memória operacional é útil quando encurta a próxima correção."
      ];
      break;
    case "website_project":
    case "marketing_plan":
      continuityQuestion =
        "Que formulações anteriores, objeções e hesitações já existem e devem ser aproveitadas antes de recomeçar do zero?";
      recalledLessons = [
        "Posicionamento difuso reaparece quando a memória comercial não é consolidada.",
        "A mesma indecisão tende a voltar se não se fixarem critérios mínimos."
      ];
      break;
  }

  const knownState = [
    `Git atual: ${context.gitStatus}`,
    `Última task conhecida: ${context.buildTask?.id || "unknown"}`,
    `Último report: ${context.latestReport?.status || "unknown"}`,
    ...hermesStateLines()
  ];

  const latestArtifacts = [...proposalLines(), ...patchLines()].slice(0, 6);

  const suggestedMemoryNote = [
    `Intent: ${routed.intent}`,
    `Mensagem: ${message}`,
    `Lição central: ${recalledLessons[0]}`,
    `Próximo contexto a recuperar: ${continuityQuestion}`
  ].join(" | ");

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    continuityQuestion,
    knownState,
    latestArtifacts,
    recalledLessons: [...recentRoadmapLessons(), ...recalledLessons].slice(0, 6),
    suggestedMemoryNote
  };
}

export function buildMnemosyneReview(message: string, routed?: RoutedIntent): MnemosyneReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatMnemosyneReview(review: MnemosyneReview): string {
  return [
    "MNEMOSYNE",
    "",
    `Questão de continuidade: ${review.continuityQuestion}`,
    "",
    "Estado conhecido:",
    ...review.knownState.map((item) => `- ${item}`),
    "",
    "Artefactos recentes:",
    ...review.latestArtifacts.map((item) => `- ${item}`),
    "",
    "Lições recordadas:",
    ...review.recalledLessons.map((item) => `- ${item}`),
    "",
    `Nota sugerida: ${review.suggestedMemoryNote}`
  ].join("\n");
}

function ensureDir(parts: string[]): string {
  const dir = path.join(root, ...parts);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function saveReview(review: MnemosyneReview): string {
  const dir = ensureDir(["founder-command-center", "olympus", "reports", "mnemosyne"]);
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

export function captureMnemosyneNote(message: string, routed?: RoutedIntent): string {
  const review = buildMnemosyneReview(message, routed);
  const dir = ensureDir(["founder-command-center", "olympus", "memory", "notes"]);
  const filePath = path.join(dir, `${review.id}.md`);
  const content = [
    `# Mnemosyne Note — ${review.id}`,
    "",
    `Criado em: ${review.createdAt}`,
    `Intent: ${review.intent}`,
    "",
    "## Mensagem",
    "",
    review.message,
    "",
    "## Continuidade",
    "",
    review.continuityQuestion,
    "",
    "## Estado conhecido",
    "",
    ...review.knownState.map((item) => `- ${item}`),
    "",
    "## Lições recordadas",
    "",
    ...review.recalledLessons.map((item) => `- ${item}`),
    "",
    "## Nota consolidada",
    "",
    review.suggestedMemoryNote,
    ""
  ].join("\n");
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

function main(): void {
  const [action, ...rest] = process.argv.slice(2);
  const message = rest.join(" ").trim();

  if (!action || !message) {
    throw new Error('Usage: mnemosyneOperationalMemory.ts <review|capture> "texto"');
  }

  if (action === "review") {
    const review = buildMnemosyneReview(message);
    const savedPath = saveReview(review);
    console.log(formatMnemosyneReview(review));
    console.log("");
    console.log(`Mnemosyne review saved: ${savedPath}`);
    return;
  }

  if (action === "capture") {
    const savedPath = captureMnemosyneNote(message);
    console.log(`Mnemosyne note saved: ${savedPath}`);
    return;
  }

  throw new Error("Action must be review or capture.");
}

main();
