import { resolveEntity } from "./brains/canonical/resolveEntity";

export function normalizeWikiLinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_match, rawLink) => {
    const parts = rawLink.split("|");
    const target = parts[0].trim();
    const label = parts[1]?.trim();

    const normalizedTarget = resolveEntity(target);

    if (label) {
      return `[[${normalizedTarget}|${label}]]`;
    }

    return `[[${normalizedTarget}]]`;
  });
}