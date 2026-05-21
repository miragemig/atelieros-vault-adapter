import { isSuspiciousDuplicate } from "./canonicalRules";

export function checkMemoryIntegrity(entities: string[]) {
  const suspicious = entities.filter(isSuspiciousDuplicate);

  return {
    valid: suspicious.length === 0,
    suspicious
  };
}