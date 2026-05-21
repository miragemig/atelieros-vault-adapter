import { getActionPolicy } from "../actions/actionPolicy";
import { ZeusActionType } from "../actions/actionTypes";
import { getCapability } from "./capabilityRegistry";

export type CapabilityDecision = {
  capabilityId: string;
  actionType: ZeusActionType;
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
};

export function evaluateCapabilityAction(
  capabilityId: string,
  actionType: ZeusActionType
): CapabilityDecision {
  const capability = getCapability(capabilityId);

  if (!capability) {
    return {
      capabilityId,
      actionType,
      allowed: false,
      requiresApproval: true,
      reason: `Unknown capability: ${capabilityId}`
    };
  }

  const actionPolicy = getActionPolicy(actionType);

  if (capability.forbiddenActions.includes(actionType)) {
    return {
      capabilityId,
      actionType,
      allowed: false,
      requiresApproval: true,
      reason: `Action ${actionType} is forbidden for capability ${capabilityId}.`
    };
  }

  if (capability.approvalRequiredFor.includes(actionType)) {
    return {
      capabilityId,
      actionType,
      allowed: false,
      requiresApproval: true,
      reason: `Action ${actionType} requires Miguel approval for capability ${capabilityId}.`
    };
  }

  if (!actionPolicy.allowedByDefault) {
    return {
      capabilityId,
      actionType,
      allowed: false,
      requiresApproval: actionPolicy.requiresMiguelApproval,
      reason: actionPolicy.reason
    };
  }

  if (!capability.allowedActions.includes(actionType)) {
    return {
      capabilityId,
      actionType,
      allowed: false,
      requiresApproval: true,
      reason: `Action ${actionType} is not explicitly allowed for capability ${capabilityId}.`
    };
  }

  return {
    capabilityId,
    actionType,
    allowed: true,
    requiresApproval: false,
    reason: `Action ${actionType} is allowed for capability ${capabilityId}.`
  };
}
