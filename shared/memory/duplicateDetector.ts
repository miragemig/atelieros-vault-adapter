export function detectDuplicateEntities(entities: string[]) {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const entity of entities) {
    if (seen.has(entity)) {
      duplicates.push(entity);
    }

    seen.add(entity);
  }

  return duplicates;
}