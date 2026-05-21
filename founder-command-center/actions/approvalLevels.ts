export type ApprovalLevel =
  | "LEVEL_0_READ_ANALYSE"
  | "LEVEL_1_PREPARE_SANDBOX"
  | "LEVEL_2_LOCAL_CHANGE"
  | "LEVEL_3_EXTERNAL_ACTION"
  | "LEVEL_4_BLOCKED";

export const approvalLevelDescriptions: Record<ApprovalLevel, string> = {
  LEVEL_0_READ_ANALYSE:
    "Read, analyse, classify, summarize and deliberate. No persistent or external side effects.",
  LEVEL_1_PREPARE_SANDBOX:
    "Prepare drafts, reports, diffs, candidates and local validation artefacts in sandbox/quarantine.",
  LEVEL_2_LOCAL_CHANGE:
    "Apply local reversible changes such as editing files, moving files or applying patches.",
  LEVEL_3_EXTERNAL_ACTION:
    "External actions such as sending email, publishing, browser/computer control, git push or submissions.",
  LEVEL_4_BLOCKED:
    "Blocked by default: paid APIs, public tunnels, destructive actions, auto-commit, auto-push and unsafe automation."
};

export function requiresExplicitApproval(level: ApprovalLevel): boolean {
  return (
    level === "LEVEL_2_LOCAL_CHANGE" ||
    level === "LEVEL_3_EXTERNAL_ACTION" ||
    level === "LEVEL_4_BLOCKED"
  );
}
