import { entityRegistry }
from "./entityRegistry";

export function resolveEntity(
  value: string
): string {

  const normalized =
    value
      .toLowerCase()
      .trim();

  for (const category of Object.values(entityRegistry)) {

    for (
      const [canonical, aliases]
      of Object.entries(category)
    ) {

      const found =
        aliases.find(
          (a) =>
            a.toLowerCase().trim()
            === normalized
        );

      if (found) {
        return canonical;
      }
    }
  }

  return value
    .replace(/\s+/g, "_");
}