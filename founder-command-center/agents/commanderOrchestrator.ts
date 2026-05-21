import { execSync } from "child_process";

function runStep(label: string, command: string) {
  console.log(`\n=== ${label} ===\n`);

  try {
    execSync(command, {
      stdio: "inherit",
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh"
    });
  } catch (error) {
    console.error(`Erro no passo: ${label}`);
    process.exit(1);
  }
}

console.log("\nFOUNDER COMMAND CENTER — ORCHESTRATOR v0.4\n");

runStep(
  "Commander Runtime",
  "npx tsx founder-command-center/agents/commanderAgent.ts"
);

runStep(
  "Support Agent",
  "npx tsx founder-command-center/agents/supportAgent.ts"
);

runStep(
  "Next Action Engine",
  "npx tsx founder-command-center/agents/nextActionEngine.ts"
);

runStep(
  "Build Queue Writer",
  "npx tsx founder-command-center/agents/buildQueueWriter.ts"
);

runStep(
  "Build Agent",
  "npx tsx founder-command-center/agents/buildAgent.ts"
);
runStep(
  "Approval Gate",
  "npx tsx founder-command-center/agents/approvalGate.ts"
);
runStep(
  "Execution Planner",
  "npx tsx founder-command-center/agents/executionPlannerAgent.ts"
);
runStep(
  "Memory Health Writer",
  "npx tsx founder-command-center/agents/memoryHealthWriter.ts"
);

runStep(
  "Queue Cleaner",
  "npx tsx founder-command-center/agents/queueCleaner.ts"
);

runStep(
  "Semantic Queue Cleaner",
  "npx tsx founder-command-center/agents/semanticQueueCleaner.ts"
);
runStep(
  "Safe Auto Builder",
  "npx tsx founder-command-center/agents/safeAutoBuilderAgent.ts"
);
runStep(
  "Safe Code Draft Agent",
  "npx tsx founder-command-center/agents/safeCodeDraftAgent.ts"
);
runStep(
  "Roadmap Code Draft Agent",
  "npx tsx founder-command-center/agents/roadmapCodeDraftAgent.ts"
);
runStep(
  "Runtime Telemetry",
  "npx tsx founder-command-center/agents/runtimeTelemetryAgent.ts"
);
console.log("\nCommander Orchestrator concluído.\n");