import { generateWithOllama } from "../providers/ollamaProvider";
import { mapInternalToClassicalOlympus } from "../olympus/classicalOlympusAdapters";
import { ZEUS_PERSONA_SYSTEM_PROMPT } from "../zeus/persona/zeusPersona";
import { RoutedIntent } from "./zeusIntentRouter";
import { createZeusResponse } from "./zeusAdvisor";
import { readOperationalContext } from "./zeusOperationalContext";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Ollama timeout after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

function formatOlympus(agentIds: string[]): string {
  return mapInternalToClassicalOlympus(agentIds)
    .map((agent) => `${agent.name}: ${agent.title}`)
    .join("; ");
}

function buildSystemPrompt(): string {
  return [
    ZEUS_PERSONA_SYSTEM_PROMPT,
    "",
    "Instruções adicionais para esta resposta:",
    "- Responde em pt-PT.",
    "- Sê conciso, mas não superficial.",
    "- Não uses linguagem teatral.",
    "- Não uses markdown excessivo.",
    "- Não ultrapasses 260 palavras salvo se o pedido exigir detalhe.",
    "- Mantém estrutura clara."
  ].join("\n");
}

function buildUserPrompt(message: string, routed: RoutedIntent): string {
  const context = readOperationalContext();

  return [
    `Pedido do Miguel: ${message}`,
    "",
    `Intent detetado: ${routed.intent}`,
    `Confiança: ${routed.confidence}`,
    `Motivo do router: ${routed.reason}`,
    "",
    `Olympus convocado: ${formatOlympus(routed.internalOlympusAgentIds) || "Nenhum agente."}`,
    "",
    "Estado operacional real:",
    `- Git: ${context.gitStatus}`,
    `- Última task: ${context.buildTask?.id || "unknown"}`,
    `- Último report: ${context.latestReport?.status || "unknown"}`,
    "",
    "Tarefa:",
    "Produz uma deliberação útil, crítica e acionável.",
    "Não transformes isto em execução.",
    "Não cries projetos.",
    "Não sugiras comandos destrutivos.",
    "Se houver tensão entre opções, propõe uma terceira via pragmática quando fizer sentido."
  ].join("\n");
}

export async function createZeusOllamaResponse(
  message: string,
  routed: RoutedIntent
): Promise<string> {
  const model =
    process.env.ZEUS_CHAT_MODEL ||
    process.env.OLLAMA_MODEL ||
    "qwen2.5-coder:7b";

  const timeoutMs = Number(process.env.ZEUS_OLLAMA_TIMEOUT_MS || 45000);

  try {
    const response = await withTimeout(
      generateWithOllama({
        model,
        system: buildSystemPrompt(),
        prompt: buildUserPrompt(message, routed)
      }),
      timeoutMs
    );

    const trimmed = response.trim();

    if (!trimmed) {
      return createZeusResponse(message, routed);
    }

    return trimmed;
  } catch (error) {
    const fallback = createZeusResponse(message, routed);
    const reason = error instanceof Error ? error.message : String(error);

    return [
      fallback,
      "",
      "Nota de sistema:",
      `Ollama Advisor indisponível ou lento. Fallback usado. Motivo: ${reason}`
    ].join("\n");
  }
}
