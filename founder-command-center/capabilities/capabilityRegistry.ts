import { ZeusActionType } from "../actions/actionTypes";

export type CapabilityStatus =
  | "disabled"
  | "planned"
  | "sandbox_only"
  | "approval_required"
  | "active";

export type ZeusCapability = {
  id: string;
  name: string;
  status: CapabilityStatus;
  description: string;
  allowedActions: ZeusActionType[];
  forbiddenActions: ZeusActionType[];
  approvalRequiredFor: ZeusActionType[];
};

export const zeusCapabilities: Record<string, ZeusCapability> = {
  dev_agent: {
    id: "dev_agent",
    name: "Dev Agent",
    status: "sandbox_only",
    description:
      "Generates code, reads errors, proposes fixes and prepares candidates without applying to core.",
    allowedActions: ["create_candidate", "create_report", "run_local_validation"],
    forbiddenActions: ["git_commit", "git_push", "install_dependency", "paid_api_call"],
    approvalRequiredFor: ["apply_patch", "edit_file"]
  },

  surgical_patch_worker: {
    id: "surgical_patch_worker",
    name: "Surgical Patch Worker",
    status: "planned",
    description:
      "Reads target files, identifies small bugs, creates minimal patch candidates and validation reports.",
    allowedActions: ["create_patch_candidate", "create_report", "run_local_validation"],
    forbiddenActions: ["git_commit", "git_push", "delete_files", "paid_api_call"],
    approvalRequiredFor: ["apply_patch", "edit_file"]
  },

  file_processor: {
    id: "file_processor",
    name: "File Processor",
    status: "planned",
    description:
      "Reads and analyses PDFs, documents and local files; prepares summaries and extracted entities.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["delete_files", "move_file"],
    approvalRequiredFor: ["edit_file", "move_file"]
  },

  browser_control: {
    id: "browser_control",
    name: "Browser Control",
    status: "approval_required",
    description:
      "Opens and operates browser sessions only after explicit approval for external interaction.",
    allowedActions: ["analyse_source", "create_report"],
    forbiddenActions: ["paid_api_call", "public_tunnel"],
    approvalRequiredFor: ["browser_control"]
  },

  computer_control: {
    id: "computer_control",
    name: "Computer Control",
    status: "approval_required",
    description:
      "Operates the local computer only through approval-gated actions.",
    allowedActions: ["read_state", "create_report"],
    forbiddenActions: ["delete_files", "install_dependency"],
    approvalRequiredFor: ["computer_control", "edit_file", "move_file"]
  },

  voice_interface: {
    id: "voice_interface",
    name: "Voice Interface",
    status: "planned",
    description:
      "Transcribes voice and prepares commands; never executes critical actions from voice alone.",
    allowedActions: ["summarize", "classify_task", "create_report"],
    forbiddenActions: ["send_email", "git_push", "paid_api_call"],
    approvalRequiredFor: ["computer_control", "browser_control"]
  },

  email_assistant: {
    id: "email_assistant",
    name: "Email Assistant",
    status: "approval_required",
    description:
      "Reads authorised communications, extracts risks and drafts responses without sending.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["delete_email"],
    approvalRequiredFor: ["send_email", "archive_email"]
  },

  adversarial_review: {
    id: "adversarial_review",
    name: "Ares Adversarial Review",
    status: "active",
    description:
      "Produces contradiction, risk framing, blocked assumptions and pressure tests without executing.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["edit_file", "apply_patch", "send_email", "git_push", "paid_api_call"],
    approvalRequiredFor: []
  },

  strategic_review: {
    id: "strategic_review",
    name: "Athena Strategic Review",
    status: "active",
    description:
      "Frames decisions, criteria, trade-offs and sequencing without executing or changing the working tree.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["edit_file", "apply_patch", "send_email", "git_push", "paid_api_call"],
    approvalRequiredFor: []
  },

  system_design: {
    id: "system_design",
    name: "Daedalus System Design",
    status: "active",
    description:
      "Frames product surfaces, system blocks and main flows without moving into production implementation.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["edit_file", "apply_patch", "send_email", "git_push", "paid_api_call"],
    approvalRequiredFor: []
  },

  external_watch: {
    id: "external_watch",
    name: "Argus External Watch",
    status: "active",
    description:
      "Frames safe watch targets, signals, cadence and guardrails for external intelligence without launching noisy monitoring.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["public_tunnel", "paid_api_call", "edit_file", "apply_patch", "send_email", "git_push"],
    approvalRequiredFor: []
  },

  narrative_review: {
    id: "narrative_review",
    name: "Apollo Narrative Review",
    status: "active",
    description:
      "Clarifies promise, audience, proof and call to action without publishing or sending anything.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["send_email", "paid_api_call", "edit_file", "apply_patch", "git_push"],
    approvalRequiredFor: []
  },

  economic_review: {
    id: "economic_review",
    name: "Plutus Economic Review",
    status: "active",
    description:
      "Frames downside, upside, cost drivers and optionality without giving regulated financial advice.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["paid_api_call", "edit_file", "apply_patch", "git_push"],
    approvalRequiredFor: []
  },

  future_research: {
    id: "future_research",
    name: "Prometheus Future Research",
    status: "active",
    description:
      "Explores bounded future-system hypotheses, entry conditions and red flags without opening uncontrolled new fronts.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["edit_file", "apply_patch", "send_email", "git_push", "paid_api_call"],
    approvalRequiredFor: []
  },

  governance_review: {
    id: "governance_review",
    name: "Themis Governance Review",
    status: "active",
    description:
      "Classifies what is allowed now, approval-gated or blocked using the real ZEUS capability and action policies.",
    allowedActions: ["read_state", "analyse_source", "summarize", "create_report"],
    forbiddenActions: ["edit_file", "apply_patch", "send_email", "git_push", "paid_api_call"],
    approvalRequiredFor: []
  },

  operational_memory: {
    id: "operational_memory",
    name: "Mnemosyne Operational Memory",
    status: "active",
    description:
      "Recalls operational context, links recent artefacts and captures lightweight memory notes for continuity.",
    allowedActions: ["read_state", "summarize", "create_report", "write_memory_note"],
    forbiddenActions: ["delete_files", "apply_patch", "send_email", "git_push", "paid_api_call"],
    approvalRequiredFor: []
  },

  final_review: {
    id: "final_review",
    name: "Harmonia Final Review",
    status: "active",
    description:
      "Checks coherence, clarity, missing pieces and readiness before ZEUS presents a conclusion.",
    allowedActions: ["analyse_source", "summarize", "create_report"],
    forbiddenActions: ["edit_file", "apply_patch", "send_email", "git_push", "paid_api_call"],
    approvalRequiredFor: []
  },

  task_queue: {
    id: "task_queue",
    name: "Task Queue",
    status: "sandbox_only",
    description:
      "Maintains queued, in-progress, failed and waiting-review task states.",
    allowedActions: ["classify_task", "create_report"],
    forbiddenActions: ["git_commit", "git_push"],
    approvalRequiredFor: ["project_creation"]
  },

  memory_manager: {
    id: "memory_manager",
    name: "Memory Manager",
    status: "sandbox_only",
    description:
      "Creates structured memory notes, decisions and lessons with links.",
    allowedActions: ["write_memory_note", "summarize", "create_report"],
    forbiddenActions: ["delete_files"],
    approvalRequiredFor: ["edit_file"]
  },

  ui_hud: {
    id: "ui_hud",
    name: "ZEUS Console HUD",
    status: "planned",
    description:
      "Operational interface for tasks, candidates, approvals, status and reports.",
    allowedActions: ["read_state", "summarize"],
    forbiddenActions: ["git_commit", "git_push", "paid_api_call"],
    approvalRequiredFor: ["browser_control", "computer_control"]
  },

  competitor_watch: {
    id: "competitor_watch",
    name: "Competitor Watch",
    status: "planned",
    description:
      "Tracks competitors, tools, repos and market signals as external intelligence.",
    allowedActions: ["analyse_source", "summarize", "create_report", "write_memory_note"],
    forbiddenActions: ["public_tunnel", "paid_api_call"],
    approvalRequiredFor: ["browser_control"]
  },

  atelieros_support: {
    id: "atelieros_support",
    name: "AtelierOS Support",
    status: "planned",
    description:
      "Receives tickets, classifies support issues, proposes responses and creates product tasks.",
    allowedActions: ["classify_task", "summarize", "create_report", "create_candidate"],
    forbiddenActions: ["send_email", "git_push", "paid_api_call"],
    approvalRequiredFor: ["send_email", "apply_patch"]
  }
};

export function getCapability(id: string): ZeusCapability | undefined {
  return zeusCapabilities[id];
}

export function listCapabilitiesByStatus(
  status: CapabilityStatus
): ZeusCapability[] {
  return Object.values(zeusCapabilities).filter(
    (capability) => capability.status === status
  );
}
