import { validateEntity } from "./validateEntity";

const validEntity = {
  id: "entity_001",
  type: "project",
  canonicalName: "Moradia_Boavista",
  aliases: ["Moradia Boavista"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const result = validateEntity(validEntity);

console.log("\nVALIDATION RESULT:\n");
console.log(result);