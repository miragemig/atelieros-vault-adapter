export type CostGuardInput = {
  provider: string;
  mayGenerateCost?: boolean;
};

export type CostGuardResult = {
  allowed: boolean;
  reason: string;
};

export function assertZeroCost(input: CostGuardInput): CostGuardResult {
  const paidApisEnabled = process.env.ENABLE_PAID_APIS === "true";
  const maxCost = Number(process.env.MAX_ADDITIONAL_COST_EUR || "0");

  if (maxCost > 0) {
    return {
      allowed: false,
      reason: "Blocked: MAX_ADDITIONAL_COST_EUR must remain 0."
    };
  }

  if (paidApisEnabled) {
    return {
      allowed: false,
      reason: "Blocked: paid APIs are enabled."
    };
  }

  if (input.mayGenerateCost) {
    return {
      allowed: false,
      reason: "Blocked: task may generate external cost."
    };
  }

  if (input.provider !== "ollama") {
    return {
      allowed: false,
      reason: `Blocked: provider '${input.provider}' is not allowed in zero-cost mode.`
    };
  }

  return {
    allowed: true,
    reason: "Allowed: local zero-cost execution."
  };
}
