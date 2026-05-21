import fs from "fs";
import path from "path";
import { checkMemoryIntegrity } from "../../shared/memory/memoryIntegrity";

const buildQueuePath = path.join(
  process.cwd(),
  "founder-command-center/BUILD_QUEUE.md"
);

function runMemoryHealthWriter() {
  const memoryCheck = checkMemoryIntegrity([
    "Moradia_Boavista",
    "Moradia_Moradia_Boavista",
    "Joao_Silva"
  ]);

  if (memoryCheck.valid) {
    console.log("Memory health OK. No action needed.");
    return;
  }

  const currentQueue = fs.readFileSync(buildQueuePath, "utf-8");

  const alreadyExists = memoryCheck.suspicious.some((item) =>
    currentQueue.includes(item)
  );

  if (alreadyExists) {
    console.log("Memory health issue already exists in Build Queue.");
    return;
  }

  const block = `

---

## Memory Health Issue

Prioridade: alta  
Origem: Memory Governance  
Estado: suggested  

Foram detetadas entidades suspeitas:

${memoryCheck.suspicious.map((item) => `- ${item}`).join("\n")}

### Ação sugerida

Rever entidades duplicadas/corrompidas e consolidar para nomes canónicos.

Criado em: ${new Date().toISOString()}
`;

  fs.appendFileSync(buildQueuePath, block, "utf-8");

  console.log("Memory health issue added to Build Queue.");
}

runMemoryHealthWriter();