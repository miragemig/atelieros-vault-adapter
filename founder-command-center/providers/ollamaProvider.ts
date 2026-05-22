export type OllamaGenerateOptions = {
  model: string;
  prompt: string;
  system?: string;
  timeoutMs?: number;
};

export async function generateWithOllama(options: OllamaGenerateOptions): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const timeoutMs = options.timeoutMs ?? 120_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: options.model,
        prompt: options.prompt,
        system: options.system,
        stream: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Ollama request failed: ${response.status} ${response.statusText}${
          body ? ` — ${body.slice(0, 500)}` : ""
        }`
      );
    }

    const data = await response.json();
    if (!data?.response) {
      const payload = JSON.stringify(data).slice(0, 200);
      throw new Error(`Ollama response missing response field. Raw: ${payload}`);
    }

    return String(data.response).trim();
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`Ollama request timed out after ${timeoutMs}ms at ${baseUrl}/api/generate`);
    }
    throw new Error(`Ollama request failed: ${error?.message || String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}



