import fs from "fs";
import path from "path";

const root = process.cwd();

function latestDraft(): string | null {
  const draftsDir = path.join(root, "founder-command-center", "hermes", "drafts");

  if (!fs.existsSync(draftsDir)) return null;

  const drafts = fs
    .readdirSync(draftsDir)
    .filter((file) => file.endsWith(".draft.md"))
    .map((file) => ({
      file,
      fullPath: path.join(draftsDir, file),
      time: fs.statSync(path.join(draftsDir, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  return drafts[0]?.fullPath || null;
}

function main() {
  const draftPath = latestDraft();

  if (!draftPath) {
    console.log("No Hermes drafts found.");
    return;
  }

  console.log(`Latest Hermes draft: ${draftPath}`);
  console.log("");
  console.log(fs.readFileSync(draftPath, "utf-8"));
}

main();
