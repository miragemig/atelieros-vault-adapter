import { execSync } from "child_process";

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function run(command: string) {
  execSync(command, {
    stdio: "inherit",
    shell: "cmd.exe"
  });
}

function main() {
  console.log("HERMES SIMPLE EMAIL FLOW");
  console.log("=".repeat(72));

  run(`.\\node_modules\\.bin\\tsx.cmd founder-command-center\\hermes\\hermesDraftReadback.ts`);
  run(`.\\node_modules\\.bin\\tsx.cmd founder-command-center\\hermes\\hermesVoiceApprove.ts ${quote("aprovo, envio")}`);
  run(`.\\node_modules\\.bin\\tsx.cmd founder-command-center\\hermes\\hermesGmailComposeBrowser.ts`);

  console.log("");
  console.log("Simple email flow completed.");
  console.log("Gmail compose is open.");
  console.log("No email was sent by ZEUS.");
  console.log("Miguel must review and click Send manually.");
}

main();
