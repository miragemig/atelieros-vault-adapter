import { normalizeEntityName } from "./canonicalRules";
import { detectDuplicateEntities } from "./duplicateDetector";
import { checkMemoryIntegrity } from "./memoryIntegrity";

const raw = [
  "Moradia Boavista",
  "Moradia_Boavista",
  "Moradia_Moradia_Boavista",
  "João Silva",
  "Joao_Silva"
];

const normalized = raw.map(normalizeEntityName);

console.log("NORMALIZED:");
console.log(normalized);

console.log("\nDUPLICATES:");
console.log(detectDuplicateEntities(normalized));

console.log("\nINTEGRITY:");
console.log(checkMemoryIntegrity(normalized));
