import { checkGovernanceGate } from "./governanceGate";

const result = checkGovernanceGate({
  actionType: "send_critical_email",
  agent: "CommanderAgent",
  project: "AtelierOS",
  riskLevel: "critico",
  hasHumanApproval: false
});

console.log(result);