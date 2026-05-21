import fs from "fs";
import path from "path";

const buildQueuePath = path.join(
  process.cwd(),
  "founder-command-center/BUILD_QUEUE.md"
);

function getTicketName(block: string) {
  const match = block.match(/Ticket:\s*(.+)/);
  return match ? match[1].trim() : null;
}

function runQueueCleaner() {
  const content = fs.readFileSync(buildQueuePath, "utf-8");
  const blocks = content.split(/\n---\n/g);

  const baseBlocks: string[] = [];
  const latestTicketBlocks = new Map<string, string>();
  let latestMemoryHealthBlock: string | null = null;

  for (const block of blocks) {
    if (block.includes("## Memory Health Issue")) {
      latestMemoryHealthBlock = block;
      continue;
    }

    if (block.includes("## Support Ticket Analysis")) {
      const ticketName = getTicketName(block);

      if (ticketName) {
        latestTicketBlocks.set(ticketName, block);
      }

      continue;
    }

    if (
      block.includes("## Sugestão automática") &&
      block.includes("### Next action proposed")
    ) {
      continue;
    }

    baseBlocks.push(block);
  }

  const cleanedBlocks = [
    ...baseBlocks,
    ...(latestMemoryHealthBlock ? [latestMemoryHealthBlock] : []),
    ...Array.from(latestTicketBlocks.values())
  ];

  fs.writeFileSync(
    buildQueuePath,
    cleanedBlocks.join("\n---\n"),
    "utf-8"
  );

  console.log("Build Queue cleaned: kept latest memory issue and latest block per ticket.");
}

runQueueCleaner();