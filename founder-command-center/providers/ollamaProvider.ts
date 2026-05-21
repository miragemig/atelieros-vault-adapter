export type OllamaGenerateOptions = {
  model: string;
  prompt: string;
  system?: string;
};

export async function generateWithOllama(options: OllamaGenerateOptions): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

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
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.response) {
    throw new Error("Ollama response did not include a response field.");
  }

  return data.response;
}



