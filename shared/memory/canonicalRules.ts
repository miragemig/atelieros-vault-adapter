export function normalizeEntityName(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function isSuspiciousDuplicate(value: string): boolean {
  return /(.+)_\1/.test(value);
}