import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { appendEvent } from "./zeusControlPlane";

const root = process.cwd();

type CandidateEntry = {
  name: string;
  fullPath: string;
  time: number;
};

function run(command: string): void {
  execSync(command, {
    cwd: root,
    stdio: "inherit",
    shell: "powershell.exe"
  });
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function latestPatchCandidate(): string | null {
  const candidatesDir = path.join(
    root,
    "founder-command-center",
    "patch-system",
    "patch-candidates"
  );

  if (!fs.existsSync(candidatesDir)) {
    return null;
  }

  const candidates = fs
    .readdirSync(candidatesDir)
    .map((name): CandidateEntry => ({
      name,
      fullPath: path.join(candidatesDir, name),
      time: fs.statSync(path.join(candidatesDir, name)).mtimeMs
    }))
    .filter((item: CandidateEntry) => fs.statSync(item.fullPath).isDirectory())
    .sort((a: CandidateEntry, b: CandidateEntry) => b.time - a.time);

  return candidates[0]?.name || null;
}

function getFlagValue(args: string[], flag: string): string {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] || "" : "";
}

function tsx(script: string, extraArgs: string[] = []): string {
  const scriptPath = script.replace(/\//g, "\\");
  const argString = extraArgs.filter(Boolean).join(" ");
  return `.\\node_modules\\.bin\\tsx.cmd ${scriptPath}${argString ? ` ${argString}` : ""}`;
}

function printHelp(): void {
  console.log([
    "ZEUS COMMAND ROUTER",
    "",
    "Core:",
    "  zeus doctor",
    "  zeus status",
    "  zeus gateway-status",
    "  zeus overnight-self-build [hours] [interval-minutes]",
    "  zeus watch [seconds]",
    "  zeus classify <text>",
    "",
    "Olympus clássico:",
    "  zeus hera-review <texto>",
    "  zeus hera-readiness",
    "  zeus hera-approve <frase>",
    "  zeus poseidon-review <texto>",
    "  zeus poseidon-browser <action> [--url ... --query ...]",
    "  zeus poseidon-preflight",
    "  zeus poseidon-compose-latest",
    "  zeus demeter-review <texto>",
    "  zeus demeter-files <action> [--path ... --name ...]",
    "  zeus athena-review <texto>",
    "  zeus apollo-review <texto>",
    "  zeus artemis-review <texto>",
    "  zeus ares-review <texto>",
    "  zeus aphrodite-review <texto>",
    "  zeus hephaestus-review <texto>",
    "  zeus hestia-review <texto>",
    "  zeus hestia-capture <texto>",
    "",
    "Compatibilidade interna:",
    "  zeus plutus-review <texto>",
    "  zeus prometheus-review <texto>",
    "  zeus themis-review <texto>",
    "  zeus apollo-review <texto>",
    "  zeus argus-review <texto>",
    "  zeus daedalus-review <texto>",
    "  zeus harmonia-review <texto>",
    "  zeus mnemosyne-review <texto>",
    "  zeus mnemosyne-capture <texto>",
    "  zeus athena-review <texto>",
    "  zeus ares-review <texto>",
    "  zeus surgical-patch <patch-task.json>",
    "  zeus review-latest",
    "  zeus review-candidate <candidate-id>",
    "  zeus apply-latest --approved-by Miguel",
    "  zeus apply-candidate <candidate-id> --approved-by Miguel",
    "",
    "Hermes safe flow:",
    "  zeus email-import <from> <to> <subject> <body>",
    "  zeus inbox-analyze <emailPath>",
    "  zeus draft-latest",
    "  zeus draft-parse-latest",
    "  zeus draft-readback",
    "  zeus voice-approve <phrase>",
    "  zeus send-readiness",
    "  zeus gmail-compose-latest",
    "  zeus browser-control-preflight",
    "  zeus browser-send-gate",
    "  zeus browser-send-now --approved-by Miguel",
    "  zeus browser-send-click --approved-by Miguel",
    "  zeus email-send-latest --approved-by Miguel",
    "  zeus simple-send-now --approved-by Miguel",
    "  zeus chrome-debug",
    "  zeus chrome-debug-compose-latest",
    "  zeus chrome-debug-close",
    "  zeus gmail-plan",
    "",
    "Runtime priority:",
    "  zeus computer <action> [args]",
    "  zeus send-active --approved-by Miguel",
    "  zeus computer wait --seconds 1",
    "  zeus computer hotkey --keys ctrl+l",
    "  zeus computer focus --title Chrome",
    "  zeus computer paste --text \"texto\"",
    "",
    "Runtime extra:",
    "  zeus open-app <nome>",
    "  zeus files <action> [--path ... --name ...]",
    "  zeus browser <action> [--url ... --query ...]",
    "",
    "Rules:",
    "  - Router does not apply patches.",
    "  - Router does not commit.",
    "  - Router does not push.",
    "  - Router does not send emails automatically.",
    "  - Critical actions remain approval-gated."
  ].join("\n"));
}

function main(): void {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "help") {
    printHelp();
    return;
  }

  try {
    appendEvent({
      source: "router",
      type: "command_invoked",
      summary: `Router command invoked: ${command}`,
      data: { args }
    });
  } catch {
    // Router logging should never block execution.
  }

  switch (command) {
    case "doctor":
      run(tsx("founder-command-center/zeus/zeusDoctor.ts"));
      return;

    case "status":
      run(tsx("founder-command-center/zeus/zeusControlPlane.ts", ["sync", quote("router:status")]));
      run(tsx("founder-command-center/zeus/zeusStatusConsole.ts"));
      return;

    case "gateway-status":
      run(tsx("founder-command-center/zeus/zeusControlPlane.ts", ["show"]));
      return;

    case "overnight-self-build": {
      const hours = args[0] || "8";
      const intervalMinutes = args[1] || "15";
      run(tsx("founder-command-center/zeus/zeusOvernightSelfBuild.ts", [hours, intervalMinutes]));
      return;
    }

    case "watch": {
      const seconds = args[0] || "15";
      run(tsx("founder-command-center/zeus/zeusWatch.ts", [seconds]));
      return;
    }

    case "classify": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Missing text for classify command.");
      }
      run(tsx("founder-command-center/patch-system/patchErrorClassifier.ts", [quote(text)]));
      return;
    }

    case "hera-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus hera-review <texto>");
      }
      run(tsx("founder-command-center/olympus/themisGovernanceReview.ts", [quote(text)]));
      return;
    }

    case "hera-readiness":
      run(tsx("founder-command-center/hermes/hermesSendReadiness.ts"));
      return;

    case "hera-approve": {
      const phrase = args.join(" ").trim();
      if (!phrase) {
        throw new Error("Usage: zeus hera-approve <frase>");
      }
      run(tsx("founder-command-center/hermes/hermesVoiceApprove.ts", [quote(phrase)]));
      return;
    }

    case "poseidon-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus poseidon-review <texto>");
      }
      run(tsx("founder-command-center/olympus/poseidonExternalSurfaceReview.ts", [quote(text)]));
      return;
    }

    case "poseidon-browser": {
      if (args.length === 0) {
        throw new Error("Usage: zeus poseidon-browser <action> [--url ... --query ...]");
      }
      run(`python founder-command-center\\zeus-runtime\\zeusBrowserControl.py ${args.map(quote).join(" ")}`);
      return;
    }

    case "poseidon-preflight":
      run(tsx("founder-command-center/hermes/hermesBrowserControlPreflight.ts"));
      return;

    case "poseidon-compose-latest":
      run(tsx("founder-command-center/hermes/hermesGmailComposeBrowser.ts"));
      return;

    case "demeter-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus demeter-review <texto>");
      }
      run(tsx("founder-command-center/olympus/plutusEconomicReview.ts", [quote(text)]));
      return;
    }

    case "demeter-files": {
      if (args.length === 0) {
        throw new Error("Usage: zeus demeter-files <action> [--path ... --name ...]");
      }
      run(`python founder-command-center\\zeus-runtime\\zeusFileControl.py ${args.map(quote).join(" ")}`);
      return;
    }

    case "plutus-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus plutus-review <texto>");
      }
      run(tsx("founder-command-center/olympus/plutusEconomicReview.ts", [quote(text)]));
      return;
    }

    case "prometheus-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus prometheus-review <texto>");
      }
      run(tsx("founder-command-center/olympus/prometheusFutureSystemsReview.ts", [quote(text)]));
      return;
    }

    case "themis-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus themis-review <texto>");
      }
      run(tsx("founder-command-center/olympus/themisGovernanceReview.ts", [quote(text)]));
      return;
    }

    case "artemis-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus artemis-review <texto>");
      }
      run(tsx("founder-command-center/olympus/argusExternalWatch.ts", [quote(text)]));
      return;
    }

    case "apollo-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus apollo-review <texto>");
      }
      run(tsx("founder-command-center/olympus/apolloNarrativeReview.ts", [quote(text)]));
      return;
    }

    case "argus-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus argus-review <texto>");
      }
      run(tsx("founder-command-center/olympus/argusExternalWatch.ts", [quote(text)]));
      return;
    }

    case "daedalus-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus daedalus-review <texto>");
      }
      run(tsx("founder-command-center/olympus/daedalusSystemDesign.ts", [quote(text)]));
      return;
    }

    case "harmonia-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus harmonia-review <texto>");
      }
      run(tsx("founder-command-center/olympus/harmoniaFinalReview.ts", [quote(text)]));
      return;
    }

    case "hestia-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus hestia-review <texto>");
      }
      run(tsx("founder-command-center/olympus/mnemosyneOperationalMemory.ts", ["review", quote(text)]));
      return;
    }

    case "hestia-capture": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus hestia-capture <texto>");
      }
      run(tsx("founder-command-center/olympus/mnemosyneOperationalMemory.ts", ["capture", quote(text)]));
      return;
    }

    case "mnemosyne-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus mnemosyne-review <texto>");
      }
      run(tsx("founder-command-center/olympus/mnemosyneOperationalMemory.ts", ["review", quote(text)]));
      return;
    }

    case "mnemosyne-capture": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus mnemosyne-capture <texto>");
      }
      run(tsx("founder-command-center/olympus/mnemosyneOperationalMemory.ts", ["capture", quote(text)]));
      return;
    }

    case "athena-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus athena-review <texto>");
      }
      run(tsx("founder-command-center/olympus/athenaStrategicReview.ts", [quote(text)]));
      return;
    }

    case "ares-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus ares-review <texto>");
      }
      run(tsx("founder-command-center/olympus/aresAdversarialReview.ts", [quote(text)]));
      return;
    }

    case "aphrodite-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus aphrodite-review <texto>");
      }
      run(tsx("founder-command-center/olympus/aphroditeExperienceReview.ts", [quote(text)]));
      return;
    }

    case "hephaestus-review": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error("Usage: zeus hephaestus-review <texto>");
      }
      run(tsx("founder-command-center/olympus/hephaestusExecutionReview.ts", [quote(text)]));
      return;
    }

    case "surgical-patch": {
      const taskPath = args[0];
      if (!taskPath) {
        throw new Error("Usage: zeus surgical-patch <patch-task.json>");
      }
      run(tsx("founder-command-center/patch-system/surgicalPatchWorker.ts", [quote(taskPath)]));
      return;
    }

    case "review-latest": {
      const candidate = latestPatchCandidate();
      if (!candidate) {
        console.log("No patch candidates found.");
        return;
      }
      run(tsx("founder-command-center/patch-system/reviewPatchCandidate.ts", [candidate]));
      return;
    }

    case "review-candidate": {
      const candidate = args[0];
      if (!candidate) {
        throw new Error("Usage: zeus review-candidate <candidate-id>");
      }
      run(tsx("founder-command-center/patch-system/reviewPatchCandidate.ts", [quote(candidate)]));
      return;
    }

    case "apply-latest": {
      const candidate = latestPatchCandidate();
      const approvedBy = getFlagValue(args, "--approved-by");
      if (!candidate) {
        console.log("No patch candidates found.");
        return;
      }
      run(
        tsx("founder-command-center/patch-system/applyPatchCandidate.ts", [
          quote(candidate),
          "--approved-by",
          quote(approvedBy)
        ])
      );
      return;
    }

    case "apply-candidate": {
      const [candidate, ...candidateArgs] = args;
      const approvedBy = getFlagValue(candidateArgs, "--approved-by");
      if (!candidate) {
        throw new Error("Usage: zeus apply-candidate <candidate-id> --approved-by Miguel");
      }
      run(
        tsx("founder-command-center/patch-system/applyPatchCandidate.ts", [
          quote(candidate),
          "--approved-by",
          quote(approvedBy)
        ])
      );
      return;
    }

    case "draft-readback":
      run(tsx("founder-command-center/hermes/hermesDraftReadback.ts"));
      return;

    case "draft-parse-latest":
      run(tsx("founder-command-center/hermes/hermesDraftParser.ts"));
      return;

    case "draft-latest":
      run(tsx("founder-command-center/hermes/hermesDraftLatest.ts"));
      return;

    case "email-flow-latest":
      run(tsx("founder-command-center/hermes/hermesEmailFlowLatest.ts"));
      return;

    case "simple-send-now": {
      const approvedBy = getFlagValue(args, "--approved-by");
      run(
        tsx("founder-command-center/hermes/hermesSimpleSendNow.ts", [
          "--approved-by",
          quote(approvedBy)
        ])
      );
      return;
    }

    case "gmail-compose-latest":
      run(tsx("founder-command-center/hermes/hermesGmailComposeBrowser.ts"));
      return;

    case "chrome-debug-compose-latest":
      run(tsx("founder-command-center/hermes/hermesChromeDebugComposeLatest.ts"));
      return;

    case "chrome-debug-close":
      run(tsx("founder-command-center/hermes/hermesChromeDebugClose.ts"));
      return;

    case "chrome-debug":
      run(tsx("founder-command-center/hermes/hermesChromeDebugLauncher.ts"));
      return;

    case "browser-send-click": {
      const approvedBy = getFlagValue(args, "--approved-by");
      run(
        tsx("founder-command-center/hermes/hermesBrowserSendClickAdapter.ts", [
          "--approved-by",
          quote(approvedBy)
        ])
      );
      return;
    }

    case "browser-control-preflight":
      run(tsx("founder-command-center/hermes/hermesBrowserControlPreflight.ts"));
      return;

    case "browser-send-now": {
      const approvedBy = getFlagValue(args, "--approved-by");
      run(
        tsx("founder-command-center/hermes/hermesBrowserSendNow.ts", [
          "--approved-by",
          quote(approvedBy)
        ])
      );
      return;
    }

    case "browser-send-gate":
      run(tsx("founder-command-center/hermes/hermesBrowserSendGate.ts"));
      return;

    case "send-readiness":
      run(tsx("founder-command-center/hermes/hermesSendReadiness.ts"));
      return;

    case "voice-approve": {
      const phrase = args.join(" ").trim();
      if (!phrase) {
        throw new Error("Usage: zeus voice-approve <phrase>");
      }
      run(tsx("founder-command-center/hermes/hermesVoiceApprove.ts", [quote(phrase)]));
      return;
    }

    case "email-send-latest": {
      const approvedBy = getFlagValue(args, "--approved-by");
      run(
        tsx("founder-command-center/hermes/hermesEmailSendGate.ts", [
          "--approved-by",
          quote(approvedBy)
        ])
      );
      return;
    }

    case "email-import": {
      const [from, to, subject, ...bodyParts] = args;
      if (!from || !to || !subject || bodyParts.length === 0) {
        throw new Error("Usage: zeus email-import <from> <to> <subject> <body>");
      }

      const body = bodyParts.join(" ");
      run(
        tsx("founder-command-center/hermes/hermesEmailImporter.ts", [
          quote(from),
          quote(to),
          quote(subject),
          quote(body)
        ])
      );
      return;
    }

    case "gmail-plan": {
      const planPath = "founder-command-center\\hermes\\gmail\\gmail-readonly-plan.md";
      if (!fs.existsSync(path.join(root, planPath))) {
        throw new Error("Hermes Gmail read-only plan not found.");
      }
      run(`Get-Content ${planPath}`);
      return;
    }

    case "open-app": {
      if (args.length === 0) {
        throw new Error("Usage: zeus open-app <nome>");
      }
      run(`python founder-command-center\\zeus-runtime\\zeusOpenApp.py ${args.map(quote).join(" ")}`);
      return;
    }

    case "files": {
      if (args.length === 0) {
        throw new Error("Usage: zeus files <action> [--path ... --name ...]");
      }
      run(`python founder-command-center\\zeus-runtime\\zeusFileControl.py ${args.map(quote).join(" ")}`);
      return;
    }

    case "browser": {
      if (args.length === 0) {
        throw new Error("Usage: zeus browser <action> [--url ... --query ...]");
      }
      run(`python founder-command-center\\zeus-runtime\\zeusBrowserControl.py ${args.map(quote).join(" ")}`);
      return;
    }

    case "inbox-analyze": {
      const emailPath = args[0];
      if (!emailPath) {
        throw new Error("Missing email sample path for inbox-analyze command.");
      }
      run(tsx("founder-command-center/hermes/hermesInboxAnalyzer.ts", [quote(emailPath)]));
      return;
    }

    case "computer": {
      if (args.length === 0) {
        throw new Error("Usage: zeus computer <action> [args]");
      }
      const computerArgs = args.map(quote).join(" ");
      run(`python founder-command-center\\zeus-runtime\\zeusComputerControl.py ${computerArgs}`);
      return;
    }

    case "send-active": {
      const approvedBy = getFlagValue(args, "--approved-by");
      run(
        `python founder-command-center\\zeus-runtime\\zeusComputerControl.py send-active --approved-by ${quote(approvedBy)}`
      );
      return;
    }

    default:
      throw new Error(`Unknown ZEUS command: ${command}`);
  }
}

main();
