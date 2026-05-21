import { ApprovalLevel } from "./approvalLevels";

export type ZeusActionType =
  | "read_state"
  | "analyse_source"
  | "summarize"
  | "classify_task"
  | "create_report"
  | "create_candidate"
  | "create_patch_candidate"
  | "run_local_validation"
  | "write_memory_note"
  | "apply_patch"
  | "edit_file"
  | "move_file"
  | "install_dependency"
  | "send_email"
  | "archive_email"
  | "delete_email"
  | "browser_control"
  | "computer_control"
  | "git_commit"
  | "git_push"
  | "public_tunnel"
  | "paid_api_call"
  | "delete_files"
  | "project_creation";

export type ZeusActionPolicyRule = {
  actionType: ZeusActionType;
  approvalLevel: ApprovalLevel;
  allowedByDefault: boolean;
  requiresMiguelApproval: boolean;
  reason: string;
};
