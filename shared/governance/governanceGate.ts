import { protectedActions } from "./protectedActions";

export interface GovernanceCheckInput {
  actionType: string;
  agent: string;
  project: string;
  riskLevel: "baixo" | "medio" | "alto" | "critico";
  hasHumanApproval: boolean;
}

export interface GovernanceCheckResult {
  allowed: boolean;
  requiresHumanApproval: boolean;
  reason: string;
}

export function checkGovernanceGate(
  input: GovernanceCheckInput
): GovernanceCheckResult {
  const isProtected = protectedActions.includes(input.actionType);

  if (isProtected && !input.hasHumanApproval) {
    return {
      allowed: false,
      requiresHumanApproval: true,
      reason: "Ação protegida exige aprovação humana."
    };
  }

  if (
    (input.riskLevel === "alto" || input.riskLevel === "critico") &&
    !input.hasHumanApproval
  ) {
    return {
      allowed: false,
      requiresHumanApproval: true,
      reason: "Ação de risco elevado exige aprovação humana."
    };
  }

  return {
    allowed: true,
    requiresHumanApproval: false,
    reason: "Ação permitida pelas regras atuais."
  };
}