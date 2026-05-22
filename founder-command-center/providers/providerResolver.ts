import fs from "fs";
import path from "path";

export type ProviderConfig = {
  type: "local" | "openai-compatible";
  baseUrl: string;
  models: string[];
  apiKeyEnv?: string;
};

export type ModelProviders = {
  defaultLocal: string;
  defaultFast: string;
  defaultCloud: string;
  providers: Record<string, ProviderConfig>;
};

let cachedConfig: ModelProviders | null = null;

function configPath(): string {
  return path.join(
    process.cwd(),
    "founder-command-center",
    "runtime",
    "modelProviders.json"
  );
}

export function loadModelProviders(): ModelProviders {
  if (cachedConfig) return cachedConfig;

  const cp = configPath();
  if (!fs.existsSync(cp)) {
    throw new Error(
      `modelProviders.json not found at ${cp}. Run a valid ZEUS installation.`
    );
  }

  cachedConfig = JSON.parse(fs.readFileSync(cp, "utf-8")) as ModelProviders;
  return cachedConfig;
}

export function resolveProvider(
  providerSpec?: string
): { providerName: string; model: string; config: ProviderConfig } {
  const cfg = loadModelProviders();

  // If no spec, use defaultLocal
  const spec = providerSpec || cfg.defaultLocal;

  // Format: "providerName:modelName" e.g. "ollama:qwen2.5-coder:7b"
  const colonIndex = spec.indexOf(":");
  if (colonIndex === -1) {
    throw new Error(
      `Invalid provider spec "${spec}". Expected format: providerName:modelName`
    );
  }

  const providerName = spec.slice(0, colonIndex);
  const model = spec.slice(colonIndex + 1);

  const config = cfg.providers[providerName];
  if (!config) {
    throw new Error(
      `Unknown provider "${providerName}". Available: ${Object.keys(cfg.providers).join(", ")}`
    );
  }

  if (!config.models.includes(model)) {
    throw new Error(
      `Model "${model}" not found in provider "${providerName}". Available: ${config.models.join(", ")}`
    );
  }

  return { providerName, model, config };
}

export function getApiKey(providerConfig: ProviderConfig): string | undefined {
  if (!providerConfig.apiKeyEnv) return undefined;
  return process.env[providerConfig.apiKeyEnv];
}