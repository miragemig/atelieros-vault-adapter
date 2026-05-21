import fs from "fs";
import path from "path";

const root = process.cwd();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function main() {
  const [from, to, subject, ...bodyParts] = process.argv.slice(2);

  if (!from || !to || !subject || bodyParts.length === 0) {
    throw new Error(
      "Usage: hermesEmailImporter.ts <from> <to> <subject> <body>"
    );
  }

  const body = bodyParts.join(" ");
  const timestamp = new Date().toISOString();
  const id = `${slugify(subject)}-${Date.now()}`;

  const email = {
    id,
    from,
    to,
    subject,
    receivedAt: timestamp,
    body
  };

  const outputDir = path.join(
    root,
    "founder-command-center",
    "hermes",
    "inbox-samples"
  );

  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${id}.json`);

  fs.writeFileSync(outputPath, JSON.stringify(email, null, 2), "utf-8");

  console.log(`Email sample imported: ${outputPath}`);
}

main();
