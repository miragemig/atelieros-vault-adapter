/**
 * ZEUS Log Redaction — lightweight sanitization for event journal and log lines.
 *
 * Policy:
 *   - Strip Bearer tokens, api_key patterns, and credential-shaped values.
 *   - Replace home directory paths with ~/ to avoid leaking absolute paths.
 *   - Mask email addresses in log entries.
 *
 * This module is intentionally self-contained and has zero dependencies.
 * It is designed to be called before any string enters the event journal
 * or persistent log files.
 */

import { homedir } from "node:os";

const REDACT_PATTERNS: Array<[RegExp, string]> = [
  // Bearer / token headers
  [/Bearer\s+[A-Za-z0-9\-._~+/=]+\b/gi, "Bearer <redacted>"],
  // api_key = "value" patterns
  [/(?:api[_-]?key|apikey|token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9\-._~+/=]+["']?/gi, "$& → <redacted>"],
  // Generic JWT-like tokens (three base64url sections separated by dots)
  [/\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, "<jwt-redacted>"],
  // Email addresses
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "<email-redacted>"],
  // GitHub tokens (ghp_, gho_, ghu_, ghs_, ghr_ prefixes)
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, "<github-token-redacted>"],
];

let cachedHome: string | null = null;

function getHome(): string {
  if (cachedHome === null) {
    try {
      cachedHome = homedir().replace(/\\/g, "/");
    } catch {
      cachedHome = "";
    }
  }
  return cachedHome;
}

/**
 * Redact a plain string by applying all known patterns and
 * replacing home directory paths with ~/.
 */
export function redactString(value: string): string {
  let result = value;

  for (const [pattern, replacement] of REDACT_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  const home = getHome();
  if (home && home.length > 1) {
    // Replace absolute home paths (case-insensitive on Windows)
    const escaped = home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), "~");
  }

  return result;
}

/**
 * Deep-clone and recursively redact string values inside objects and arrays.
 * Returns a new sanitised value; does not mutate the input.
 */
export function redactData(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return redactString(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactData(item));
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Redact known sensitive keys entirely
      if (/^(token|secret|password|apiKey|api_key|credential|key)$/i.test(key)) {
        result[key] = "<redacted>";
      } else {
        result[key] = redactData(value);
      }
    }
    return result;
  }

  return data;
}