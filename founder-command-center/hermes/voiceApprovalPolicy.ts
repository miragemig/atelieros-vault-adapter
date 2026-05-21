export type VoiceApprovalDecision = {
  allowed: boolean;
  reason: string;
  approvalType: "standalone" | "contextual_after_readback" | "rejected";
};

const standaloneApprovals = [
  "zeus, aprovo envio do último draft",
  "zeus aprovo envio do último draft"
];

const contextualApprovals = [
  "aprovo, envio",
  "aprovo envio",
  "aprovo, podes enviar",
  "aprovo podes enviar"
];

const rejectedApprovals = [
  "sim",
  "ok",
  "manda",
  "envia",
  "pode ser",
  "força",
  "forca",
  "está bem",
  "esta bem",
  "ta bem",
  "tá bem"
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function evaluateVoiceEmailApproval(
  phrase: string,
  options: {
    readbackCompletedAt?: string;
    sendQuestionAskedAt?: string;
    now?: string;
    validitySeconds?: number;
  } = {}
): VoiceApprovalDecision {
  const normalizedPhrase = normalize(phrase);

  const normalizedStandalone = standaloneApprovals.map(normalize);
  const normalizedContextual = contextualApprovals.map(normalize);
  const normalizedRejected = rejectedApprovals.map(normalize);

  if (normalizedRejected.includes(normalizedPhrase)) {
    return {
      allowed: false,
      reason: "Ambiguous or weak approval phrase.",
      approvalType: "rejected"
    };
  }

  if (normalizedStandalone.includes(normalizedPhrase)) {
    return {
      allowed: true,
      reason: "Explicit standalone approval phrase.",
      approvalType: "standalone"
    };
  }

  if (normalizedContextual.includes(normalizedPhrase)) {
    if (!options.readbackCompletedAt || !options.sendQuestionAskedAt) {
      return {
        allowed: false,
        reason: "Contextual approval requires recent draft readback and explicit send question.",
        approvalType: "rejected"
      };
    }

    const now = new Date(options.now || new Date().toISOString()).getTime();
    const readbackTime = new Date(options.readbackCompletedAt).getTime();
    const questionTime = new Date(options.sendQuestionAskedAt).getTime();
    const validitySeconds = options.validitySeconds || 120;

    const readbackAgeSeconds = Math.floor((now - readbackTime) / 1000);
    const questionAgeSeconds = Math.floor((now - questionTime) / 1000);

    if (
      Number.isNaN(readbackTime) ||
      Number.isNaN(questionTime) ||
      readbackAgeSeconds < 0 ||
      questionAgeSeconds < 0 ||
      readbackAgeSeconds > validitySeconds ||
      questionAgeSeconds > validitySeconds
    ) {
      return {
        allowed: false,
        reason: "Draft readback or send question is missing, invalid or expired.",
        approvalType: "rejected"
      };
    }

    return {
      allowed: true,
      reason: "Contextual approval accepted after recent draft readback and explicit send question.",
      approvalType: "contextual_after_readback"
    };
  }

  return {
    allowed: false,
    reason: "Phrase does not match approved voice-send policy.",
    approvalType: "rejected"
  };
}

function main() {
  const phrase = process.argv.slice(2).join(" ");

  if (!phrase) {
    throw new Error("Usage: voiceApprovalPolicy.ts <approval phrase>");
  }

  const result = evaluateVoiceEmailApproval(phrase);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith("voiceApprovalPolicy.ts")) {
  main();
}

