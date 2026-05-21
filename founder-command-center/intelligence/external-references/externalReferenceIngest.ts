import fs from "fs";
import path from "path";
import { ExternalReferenceInput, ExternalReferenceRecord } from "./referenceTypes";

const root = process.cwd();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toMarkdown(record: ExternalReferenceRecord): string {
  return [
    "---",
    "type: external_reference",
    `id: ${record.id}`,
    `reference_type: ${record.type}`,
    `licence_risk: ${record.licenceRisk}`,
    `atelieros_reuse_policy: ${record.atelierosReusePolicy}`,
    `created_at: ${record.createdAt}`,
    `status: ${record.status}`,
    "---",
    "",
    `# External Reference — ${record.title}`,
    "",
    "## Source",
    `- Label: ${record.sourceLabel}`,
    `- Path/URL: ${record.sourcePathOrUrl || "not_provided"}`,
    "",
    "## Observed capabilities",
    ...record.observedCapabilities.map((item) => `- ${item}`),
    "",
    "## Useful patterns",
    ...record.usefulPatterns.map((item) => `- ${item}`),
    "",
    "## Risks",
    ...record.risks.map((item) => `- ${item}`),
    "",
    "## Licence / contamination assessment",
    `- Licence risk: ${record.licenceRisk}`,
    `- AtelierOS reuse policy: ${record.atelierosReusePolicy}`,
    "",
    "## Forbidden reuse",
    ...record.forbiddenReuse.map((item) => `- ${item}`),
    "",
    "## Possible ZEUS tasks",
    ...record.possibleZeusTasks.map((item) => `- ${item}`),
    "",
    "## Notes",
    record.notes || "No additional notes.",
    "",
    "## Rule",
    "This reference may inform ZEUS capabilities and AtelierOS roadmap decisions. Any implementation that reaches AtelierOS must be clean-room, approval-gated and licence-safe."
  ].join("\n");
}

export function ingestExternalReference(input: ExternalReferenceInput): string {
  const record: ExternalReferenceRecord = {
    ...input,
    createdAt: new Date().toISOString(),
    status: "recorded"
  };

  const outputDir = path.join(
    root,
    "founder-command-center",
    "intelligence",
    "external-references",
    "extracted"
  );

  fs.mkdirSync(outputDir, { recursive: true });

  const fileName = `${slugify(record.id || record.title)}.md`;
  const outputPath = path.join(outputDir, fileName);

  fs.writeFileSync(outputPath, toMarkdown(record), "utf-8");

  return outputPath;
}

function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Usage: externalReferenceIngest.ts <reference-input.json>");
  }

  const absoluteInputPath = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(root, inputPath);

  const input = JSON.parse(
    fs.readFileSync(absoluteInputPath, "utf-8")
  ) as ExternalReferenceInput;

  const outputPath = ingestExternalReference(input);

  console.log(`External reference recorded: ${outputPath}`);
}

main();
