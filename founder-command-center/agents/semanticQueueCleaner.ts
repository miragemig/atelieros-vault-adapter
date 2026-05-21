import fs from "fs";
import path from "path";

const buildQueuePath = path.join(
  process.cwd(),
  "founder-command-center/BUILD_QUEUE.md"
);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/criado em:.+/g, "")
    .replace(/ticket:\s*.+/g, "")
    .replace(/\d{4}-\d{2}-\d{2}.+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSupportTicket(block: string) {
  return block.includes("## Support Ticket Analysis");
}

function runSemanticQueueCleaner() {
  const content = fs.readFileSync(buildQueuePath, "utf-8");
  const blocks = content.split(/\n---\n/g);

  const baseBlocks: string[] = [];
  const supportBlocks = new Map<string, string>();

  for (const block of blocks) {
    if (!isSupportTicket(block)) {
      baseBlocks.push(block);
      continue;
    }

    const key = normalizeText(block);

    // Map sobrescreve blocos semelhantes e mantém o mais recente no ficheiro.
    supportBlocks.set(key, block);
  }

  const cleanedBlocks = [
    ...baseBlocks,
    ...Array.from(supportBlocks.values())
  ];

  fs.writeFileSync(
    buildQueuePath,
    cleanedBlocks.join("\n---\n"),
    "utf-8"
  );

  console.log("Semantic Queue Cleaner completed.");
  console.log("Support blocks before:", blocks.filter(isSupportTicket).length);
  console.log("Support blocks after:", supportBlocks.size);
}

runSemanticQueueCleaner();