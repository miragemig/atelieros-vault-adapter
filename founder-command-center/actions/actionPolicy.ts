import { ApprovalLevel } from "./approvalLevels";
import { ZeusActionPolicyRule, ZeusActionType } from "./actionTypes";

const policy: Record<ZeusActionType, ZeusActionPolicyRule> = {
  read_state: {
    actionType: "read_state",
    approvalLevel: "LEVEL_0_READ_ANALYSE",
    allowedByDefault: true,
    requiresMiguelApproval: false,
    reason: "Reading state has no persistent side effects."
  },
  analyse_source: {
    actionType: "analyse_source",
    approvalLevel: "LEVEL_0_READ_ANALYSE",
    allowedByDefault: true,
    requiresMiguelApproval: false,
    reason: "Analysis is allowed when it does not alter files or external systems."
  },
  summarize: {
    actionType: "summarize",
    approvalLevel: "LEVEL_0_READ_ANALYSE",
    allowedByDefault: true,
    requiresMiguelApproval: false,
    reason: "Summarization is non-destructive."
  },
  classify_task: {
    actionType: "classify_task",
    approvalLevel: "LEVEL_0_READ_ANALYSE",
    allowedByDefault: true,
    requiresMiguelApproval: false,
    reason: "Task classification is advisory."
  },
  create_report: {
    actionType: "create_report",
    approvalLevel: "LEVEL_1_PREPARE_SANDBOX",
    allowedByDefault: true,
    requiresMiguelApproval: false,
    reason: "Reports are preparation artefacts."
  },
  create_candidate: {
    actionType: "create_candidate",
    approvalLevel: "LEVEL_1_PREPARE_SANDBOX",
    allowedByDefault: true,
    requiresMiguelApproval: false,
    reason: "Candidates prepare reviewable work without applying to core."
  },
  create_patch_candidate: {
    actionType: "create_patch_candidate",
    approvalLevel: "LEVEL_1_PREPARE_SANDBOX",
    allowedByDefault: true,
    requiresMiguelApproval: false,
    reason: "Patch candidates are review artefacts and do not apply themselves."
  },
  run_local_validation: {
    actionType: "run_local_validation",
    approvalLevel: "LEVEL_1_PREPARE_SANDBOX",
    allowedByDefault: true,
    requiresMiguelApproval: false,
    reason: "Local validation is allowed when it does not mutate external systems."
  },
  write_memory_note: {
    actionType: "write_memory_note",
    approvalLevel: "LEVEL_1_PREPARE_SANDBOX",
    allowedByDefault: true,
    requiresMiguelApproval: false,
    reason: "Non-critical memory notes may be prepared; critical memory rewrites remain gated."
  },
  apply_patch: {
    actionType: "apply_patch",
    approvalLevel: "LEVEL_2_LOCAL_CHANGE",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Applying a patch changes the working tree."
  },
  edit_file: {
    actionType: "edit_file",
    approvalLevel: "LEVEL_2_LOCAL_CHANGE",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Editing existing files requires explicit approval."
  },
  move_file: {
    actionType: "move_file",
    approvalLevel: "LEVEL_2_LOCAL_CHANGE",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Moving files can break references and must be approved."
  },
  install_dependency: {
    actionType: "install_dependency",
    approvalLevel: "LEVEL_4_BLOCKED",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Dependency installation is blocked by default."
  },
  send_email: {
    actionType: "send_email",
    approvalLevel: "LEVEL_3_EXTERNAL_ACTION",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Sending email is an external action."
  },
  archive_email: {
    actionType: "archive_email",
    approvalLevel: "LEVEL_3_EXTERNAL_ACTION",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Archiving email changes an external system."
  },
  delete_email: {
    actionType: "delete_email",
    approvalLevel: "LEVEL_3_EXTERNAL_ACTION",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Deleting email changes an external system."
  },
  browser_control: {
    actionType: "browser_control",
    approvalLevel: "LEVEL_3_EXTERNAL_ACTION",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Browser control can interact with external accounts and services."
  },
  computer_control: {
    actionType: "computer_control",
    approvalLevel: "LEVEL_3_EXTERNAL_ACTION",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Computer control can create broad local side effects."
  },
  git_commit: {
    actionType: "git_commit",
    approvalLevel: "LEVEL_3_EXTERNAL_ACTION",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Git commit records changes and must be explicit."
  },
  git_push: {
    actionType: "git_push",
    approvalLevel: "LEVEL_3_EXTERNAL_ACTION",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Git push publishes changes externally."
  },
  public_tunnel: {
    actionType: "public_tunnel",
    approvalLevel: "LEVEL_4_BLOCKED",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Public tunnels expose local services and are blocked by default."
  },
  paid_api_call: {
    actionType: "paid_api_call",
    approvalLevel: "LEVEL_4_BLOCKED",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Paid APIs violate zero-cost-first policy unless explicitly approved."
  },
  delete_files: {
    actionType: "delete_files",
    approvalLevel: "LEVEL_4_BLOCKED",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "File deletion is destructive and blocked by default."
  },
  project_creation: {
    actionType: "project_creation",
    approvalLevel: "LEVEL_2_LOCAL_CHANGE",
    allowedByDefault: false,
    requiresMiguelApproval: true,
    reason: "Project creation creates persistent structure and must be approved."
  }
};

export function getActionPolicy(actionType: ZeusActionType): ZeusActionPolicyRule {
  return policy[actionType];
}

export function isActionAllowedByDefault(actionType: ZeusActionType): boolean {
  return policy[actionType].allowedByDefault;
}

export function getApprovalLevel(actionType: ZeusActionType): ApprovalLevel {
  return policy[actionType].approvalLevel;
}
