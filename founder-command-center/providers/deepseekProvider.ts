import { resolveProvider, getApiKey } from "./providerResolver";

export type DeepSeekGenerateOptions = {
  model?: string;
  prompt: string;
  system?: string;
};

export async function generateWithDeepSeek(options: DeepSeekGenerateOptions): Promise<string> {
  const resolved = resolveProvider(options.model || undefined);

  // Only allow DeepSeek when provider is explicitly requested or defaultCloud
  if (resolved.providerName !== "deepseek") {
    throw new Error(
      `DeepSeek provider called but resolved to "${resolved.providerName}". Use provider spec "deepseek:modelName".`
    );
  }

  const apiKey = getApiKey(resolved.config);
  if (!apiKey) {
    throw new Error(
      `DeepSeek API key not found. Set the ${resolved.config.apiKeyEnv} environment variable.`
    );
  }

  const response = await fetch(`${resolved.config.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: resolved.model,
      messages: [
        ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
        { role: "user" as const, content: options.prompt }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `DeepSeek request failed: ${response.status} ${response.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek response did not include a message content.");
  }

  return content.trim();
}