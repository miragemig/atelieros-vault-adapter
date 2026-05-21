/**
 * Normalizes the entity name by removing duplicated underscore-separated tokens.
 * Preserves original casing and first occurrence order.
 *
 * Example:
 * Moradia_Moradia_Boavista -> Moradia_Boavista
 */
export function normalizeEntityName(input: string): string {
  const tokens = input
    .split("_")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const seenTokens = new Set<string>();
  const normalizedTokens: string[] = [];

  for (const token of tokens) {
    if (!seenTokens.has(token)) {
      seenTokens.add(token);
      normalizedTokens.push(token);
    }
  }

  return normalizedTokens.join("_");
}

/**
 * Detects duplicated underscore-separated tokens.
 *
 * Example:
 * Moradia_Moradia_Boavista -> true
 * Moradia_Boavista -> false
 */
export function detectSuspiciousEntityName(input: string): boolean {
  const tokens = input
    .split("_")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const tokenCount = new Map<string, number>();

  for (const token of tokens) {
    tokenCount.set(token, (tokenCount.get(token) || 0) + 1);
  }

  for (const count of tokenCount.values()) {
    if (count > 1) {
      return true;
    }
  }

  return false;
}

/**
 * Deduplicates entity names after normalization.
 *
 * Example:
 * ["Moradia_Moradia_Boavista", "Moradia_Boavista"]
 * -> ["Moradia_Boavista"]
 */
export function deduplicateEntityNames(inputs: string[]): string[] {
  const uniqueEntities = new Set<string>();

  for (const input of inputs) {
    const normalized = normalizeEntityName(input);

    if (normalized.length > 0) {
      uniqueEntities.add(normalized);
    }
  }

  return Array.from(uniqueEntities);
}
