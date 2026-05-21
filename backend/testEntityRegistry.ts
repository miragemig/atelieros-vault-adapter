import { normalizeEntityName } from "./entityRegistry";

const tests = [
  "Moradia Boavista",
  "Boavista",
  "João Silva",
  "Alterações de Cliente",
  "Scope Guard",
];

for (const item of tests) {
  console.log(`${item} -> ${normalizeEntityName(item)}`);
}