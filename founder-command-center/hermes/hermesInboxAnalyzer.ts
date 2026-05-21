import fs from "fs";
import path from "path";

const root = process.cwd();

type EmailSample = {
  id: string;
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
  body: string;
};

type HermesReport = {
  emailId: string;
  classification: string;
  priority: "low" | "medium" | "high" | "critical";
  extractedRisks: string[];
  extractedActions: string[];
  possibleScopeChange: boolean;
  deadlinePressure: boolean;
  draftPath: string;
};

function readJson(filePath: string): EmailSample {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function includesAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

function classifyEmail(email: EmailSample): HermesReport {
  const combined = `${email.subject}\n${email.body}`;

  const possibleScopeChange = includesAny(combined, [
    "acrescentar",
    "alteração",
    "alterar",
    "rever a proposta",
    "nova divisão",
    "pedido inicial",
    "mais uma",
    "também queríamos"
  ]);

  const deadlinePressure = includesAny(combined, [
    "esta semana",
    "urgente",
    "com urgência",
    "hoje",
    "amanhã",
    "prazo"
  ]);

  const risks: string[] = [];
  const actions: string[] = [];

  if (possibleScopeChange) {
    risks.push("Possível alteração de âmbito face ao pedido/proposta inicial.");
    actions.push("Verificar proposta/honorários antes de aceitar trabalho adicional.");
  }

  if (deadlinePressure) {
    risks.push("Pressão temporal potencialmente incompatível com validação técnica/contratual.");
    actions.push("Responder sem assumir prazo antes de avaliar impacto.");
  }

  if (risks.length === 0) {
    risks.push("Sem risco contratual evidente no conteúdo analisado.");
    actions.push("Responder em modo informativo.");
  }

  const priority =
    possibleScopeChange && deadlinePressure
      ? "high"
      : possibleScopeChange
        ? "medium"
        : "low";

  return {
    emailId: email.id,
    classification: possibleScopeChange
      ? "scope_change_request"
      : "general_message",
    priority,
    extractedRisks: risks,
    extractedActions: actions,
    possibleScopeChange,
    deadlinePressure,
    draftPath: ""
  };
}

function createDraft(email: EmailSample, report: HermesReport): string {
  const draftsDir = path.join(root, "founder-command-center", "hermes", "drafts");
  fs.mkdirSync(draftsDir, { recursive: true });

  const draftPath = path.join(draftsDir, `${email.id}.draft.md`);

  const body = [
    `# Draft reply — ${email.subject}`,
    "",
    "## Status",
    "Draft only. Not sent.",
    "",
    "## To",
    email.from,
    "",
    "## Proposed reply",
    "",
    "Bom dia,",
    "",
    "Obrigado pela mensagem.",
    "",
    "Antes de confirmar a possibilidade de incluir essa alteração e respetivo prazo, terei de verificar o impacto no âmbito inicialmente considerado, nomeadamente ao nível de trabalho adicional, prazos e eventual revisão de honorários.",
    "",
    "Assim que fizer essa verificação, envio indicação mais concreta.",
    "",
    "Cumprimentos,",
    "Miguel",
    "",
    "## Hermes notes",
    ...report.extractedRisks.map((risk) => `- Risk: ${risk}`),
    ...report.extractedActions.map((action) => `- Action: ${action}`)
  ].join("\n");

  fs.writeFileSync(draftPath, body, "utf-8");

  return draftPath;
}

function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Usage: hermesInboxAnalyzer.ts <email-sample-json>");
  }

  const absolutePath = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(root, inputPath);

  const email = readJson(absolutePath);
  const report = classifyEmail(email);
  const draftPath = createDraft(email, report);

  report.draftPath = draftPath;

  const reportsDir = path.join(root, "founder-command-center", "hermes", "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const reportPath = path.join(reportsDir, `${email.id}.report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`Hermes report created: ${reportPath}`);
  console.log(`Draft created: ${draftPath}`);
  console.log(JSON.stringify(report, null, 2));
}

main();
