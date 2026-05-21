import fs from "fs";
import path from "path";
import { ZeusActionType } from "../actions/actionTypes";
import { getActionPolicy } from "../actions/actionPolicy";
import { routeIntent, RoutedIntent } from "../chat/zeusIntentRouter";
import { readOperationalContext } from "../chat/zeusOperationalContext";
import { evaluateCapabilityAction } from "../capabilities/capabilityPolicy";

const root = process.cwd();

type CapabilityActionCheck = {
  capabilityId: string;
  actionType: ZeusActionType;
  label: string;
};

export type ThemisReview = {
  id: string;
  createdAt: string;
  message: string;
  intent: string;
  governanceQuestion: string;
  verdict: "allowed_now" | "approval_gated" | "blocked_now";
  allowedNow: string[];
  approvalGated: string[];
  blockedNow: string[];
  criticalBoundary: string;
  recommendation: string;
};

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function scenarioChecks(intent: RoutedIntent["intent"]): CapabilityActionCheck[] {
  switch (intent) {
    case "website_project":
      return [
        { capabilityId: "ui_hud", actionType: "read_state", label: "Ler estado e preparar enquadramento de interface" },
        { capabilityId: "narrative_review", actionType: "create_report", label: "Preparar narrativa e proposta de valor" },
        { capabilityId: "system_design", actionType: "create_report", label: "Preparar estrutura e fluxo do sistema" },
        { capabilityId: "ui_hud", actionType: "project_creation", label: "Criar projeto persistente de UI" }
      ];

    case "marketing_plan":
      return [
        { capabilityId: "narrative_review", actionType: "create_report", label: "Preparar mensagem e posicionamento" },
        { capabilityId: "email_assistant", actionType: "send_email", label: "Enviar comunicação externa" },
        { capabilityId: "browser_control", actionType: "browser_control", label: "Operar canais externos por browser" }
      ];

    case "build_pipeline":
    case "software_project":
    case "automation_project":
      return [
        { capabilityId: "surgical_patch_worker", actionType: "create_patch_candidate", label: "Criar patch candidate auditável" },
        { capabilityId: "dev_agent", actionType: "run_local_validation", label: "Correr validação local" },
        { capabilityId: "surgical_patch_worker", actionType: "apply_patch", label: "Aplicar patch ao working tree" },
        { capabilityId: "dev_agent", actionType: "install_dependency", label: "Instalar nova dependência" }
      ];

    case "knowledge_request":
      return [
        { capabilityId: "future_research", actionType: "create_report", label: "Preparar investigação estruturada" },
        { capabilityId: "operational_memory", actionType: "write_memory_note", label: "Guardar nota operacional leve" },
        { capabilityId: "browser_control", actionType: "browser_control", label: "Abrir navegação externa automatizada" }
      ];

    case "finance_analysis":
      return [
        { capabilityId: "economic_review", actionType: "create_report", label: "Preparar parecer económico" },
        { capabilityId: "email_assistant", actionType: "send_email", label: "Enviar decisão ou proposta externa" }
      ];

    case "status":
      return [
        { capabilityId: "task_queue", actionType: "create_report", label: "Gerar estado operacional" },
        { capabilityId: "operational_memory", actionType: "read_state", label: "Ler memória e contexto atual" }
      ];

    default:
      return [
        { capabilityId: "strategic_review", actionType: "create_report", label: "Preparar deliberação escrita" },
        { capabilityId: "operational_memory", actionType: "write_memory_note", label: "Capturar nota de continuidade" },
        { capabilityId: "browser_control", actionType: "browser_control", label: "Controlar browser externo" },
        { capabilityId: "computer_control", actionType: "computer_control", label: "Controlar o computador" }
      ];
  }
}

function createReview(message: string, routed: RoutedIntent): ThemisReview {
  const context = readOperationalContext();
  const id = `${Date.now()}-${safeFileName(message)}`;
  const checks = scenarioChecks(routed.intent);

  const allowedNow: string[] = [];
  const approvalGated: string[] = [];
  const blockedNow: string[] = [];

  for (const check of checks) {
    const decision = evaluateCapabilityAction(check.capabilityId, check.actionType);
    const policy = getActionPolicy(check.actionType);
    const line = `${check.label} [${check.capabilityId}:${check.actionType}]`;

    if (decision.allowed) {
      allowedNow.push(line);
      continue;
    }

    if (policy.approvalLevel === "LEVEL_4_BLOCKED") {
      blockedNow.push(line);
      continue;
    }

    if (decision.requiresApproval) {
      approvalGated.push(line);
      continue;
    }

    blockedNow.push(line);
  }

  let governanceQuestion =
    "O que pode avançar já, o que exige aprovação explícita e o que deve ficar bloqueado nesta frente?";
  let criticalBoundary =
    "Nenhuma ação persistente ou externa deve avançar sem Miguel quando tocar ficheiros, contas, browser, computador ou envio.";
  let recommendation =
    "Ficar dentro da zona permitida: preparar, analisar e produzir artefactos auditáveis antes de qualquer execução sensível.";

  switch (routed.intent) {
    case "website_project":
      governanceQuestion =
        "Nesta frente de website, o que é deliberação/preparação legítima e o que já seria criação persistente prematura?";
      criticalBoundary =
        "Design, narrativa e estrutura podem ser preparados; criar projeto, mexer no working tree ou operar browser externo exige gate.";
      recommendation =
        "Preparar proposta, fluxo e mensagem primeiro. Só abrir execução persistente após decisão explícita.";
      break;

    case "marketing_plan":
      governanceQuestion =
        "Que parte da comunicação pode ser preparada sem risco e que parte continua vedada até aprovação?";
      criticalBoundary =
        "Rascunhos e pareceres podem avançar; envio, publicação e interação externa continuam approval-gated.";
      recommendation =
        "Usar Apollo/Hermes para preparar, nunca para publicar ou enviar sem aprovação contextual.";
      break;

    case "build_pipeline":
    case "software_project":
    case "automation_project":
      governanceQuestion =
        "Na frente técnica, que ações ficam no modo preparar/validar e quais continuam protegidas por gate?";
      criticalBoundary =
        "Criar candidates e validar localmente é permitido; aplicar patches, instalar dependências ou abrir novas frentes permanece controlado.";
      recommendation =
        "Favorecer candidates, relatórios e validação. Aplicação ao core só com aprovação explícita.";
      break;

    case "knowledge_request":
      governanceQuestion =
        "Como investigar e consolidar aprendizagem sem transformar curiosidade em automação ou mudança estrutural?";
      criticalBoundary =
        "Investigação, síntese e notas leves podem avançar; browser externo automatizado continua sensível.";
      recommendation =
        "Conter a investigação a outputs escritos e comparativos antes de qualquer ação externa.";
      break;
  }

  let verdict: ThemisReview["verdict"] = "allowed_now";
  if (blockedNow.length > 0) {
    verdict = "blocked_now";
  } else if (approvalGated.length > 0) {
    verdict = "approval_gated";
  }

  if (context.gitStatus !== "clean") {
    criticalBoundary += " Git com alterações locais pede ainda mais disciplina antes de aplicar mudanças.";
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    message,
    intent: routed.intent,
    governanceQuestion,
    verdict,
    allowedNow,
    approvalGated,
    blockedNow,
    criticalBoundary,
    recommendation
  };
}

export function buildThemisReview(message: string, routed?: RoutedIntent): ThemisReview {
  return createReview(message, routed || routeIntent(message));
}

export function formatThemisReview(review: ThemisReview): string {
  return [
    "THEMIS",
    "",
    `Questão de governação: ${review.governanceQuestion}`,
    `Veredito: ${review.verdict}`,
    "",
    "Permitido agora:",
    ...(review.allowedNow.length ? review.allowedNow.map((item) => `- ${item}`) : ["- nada relevante"]),
    "",
    "Exige aprovação:",
    ...(review.approvalGated.length ? review.approvalGated.map((item) => `- ${item}`) : ["- nada relevante"]),
    "",
    "Bloqueado agora:",
    ...(review.blockedNow.length ? review.blockedNow.map((item) => `- ${item}`) : ["- nada relevante"]),
    "",
    `Fronteira crítica: ${review.criticalBoundary}`,
    `Recomendação: ${review.recommendation}`
  ].join("\n");
}

function saveReview(review: ThemisReview): string {
  const dir = path.join(root, "founder-command-center", "olympus", "reports", "themis");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${review.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(review, null, 2), "utf-8");
  return filePath;
}

function main(): void {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    throw new Error('Usage: themisGovernanceReview.ts "pedido, frente ou ação a enquadrar"');
  }

  const review = buildThemisReview(message);
  const savedPath = saveReview(review);

  console.log(formatThemisReview(review));
  console.log("");
  console.log(`Themis review saved: ${savedPath}`);
}

main();
