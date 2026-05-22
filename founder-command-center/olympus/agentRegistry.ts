export type OperationalStatus =
  | "ACTIVE_NOW"
  | "DESIGNED_NEXT"
  | "FUTURE_STANDBY";

export type CanonicalStatus = "classical_12" | "internal_absorbed";

export type OlympusAgent = {
  id: string;
  name: string;
  title: string;
  role: string;
  domains: string[];
  operationalStatus: OperationalStatus;
  canonicalStatus?: CanonicalStatus;
  absorbedInto?: string[];
  canAdvise: boolean;
  canExecute: boolean;
  requiresApprovalFor: string[];
  limits: string[];
  boundary?: string;
};

export const OLYMPUS_PRINCIPLES = {
  miguel: "Supreme Tribunal and final authority.",
  zeus: "Sovereign judge-orchestrator. Deliberates, recommends and requests approval.",
  olympus:
    "Operational domain where the gods-experts reside and issue expert opinions.",
  gods:
    "Domain experts. They inform, review, build or monitor. They do not make final decisions.",
  rule:
    "Experts inform. ZEUS deliberates. Miguel approves. Themis blocks critical actions."
} as const;

export const CANONICAL_OLYMPUS_12 = [
  "zeus",
  "hera",
  "poseidon",
  "demeter",
  "athena",
  "apollo",
  "artemis",
  "ares",
  "aphrodite",
  "hephaestus",
  "hermes",
  "hestia"
] as const;

export const INTERNAL_ABSORBED_FUNCTIONS: Record<string, string[]> = {
  themis: ["hera", "athena"],
  mnemosyne: ["hestia"],
  harmonia: ["apollo"],
  daedalus: ["athena", "hephaestus"],
  argus: ["artemis"],
  plutus: ["demeter", "athena"],
  prometheus: ["athena", "hephaestus"]
};

export const olympusAgents: Record<string, OlympusAgent> = {
  zeus: {
    id: "zeus",
    name: "ZEUS",
    title: "Sovereign Judge-Orchestrator",
    role:
      "Formulates the real question, summons the gods of Olympus, weighs evidence, resolves contradictions, deliberates and recommends the next safe action.",
    domains: ["deliberation", "orchestration", "judgement", "approval-request"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: ["critical_decision", "execution_authorization"],
    limits: [
      "Does not bypass Miguel.",
      "Does not execute critical actions directly.",
      "Does not treat sources as truth without evidence review."
    ],
    boundary:
      "ZEUS deliberates and recommends. Miguel remains the Supreme Tribunal."
  },

  hera: {
    id: "hera",
    name: "Hera",
    title: "Relational and Institutional Governance",
    role:
      "Protects commitments, reputation, institutional coherence, external posture and responsibility framing.",
    domains: ["relationships", "reputation", "governance", "institutional-order", "commitments"],
    operationalStatus: "DESIGNED_NEXT",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: ["policy_change", "external_commitment"],
    limits: ["Does not execute external actions directly."],
    boundary:
      "Hera protects coherence of commitments and external posture. ZEUS still deliberates and Miguel still decides."
  },

  poseidon: {
    id: "poseidon",
    name: "Poseidon",
    title: "External Surfaces, Browser and Network Volatility",
    role:
      "Handles unstable external surfaces such as browser interactions, network-connected flows and volatile environments.",
    domains: ["browser", "network", "external-surfaces", "volatility", "automation"],
    operationalStatus: "DESIGNED_NEXT",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: true,
    requiresApprovalFor: ["browser_control", "external_monitoring"],
    limits: ["Cannot interact with external systems without approval."],
    boundary:
      "Poseidon manages unstable outer surfaces, but all sensitive browser/network action remains gated."
  },

  demeter: {
    id: "demeter",
    name: "Demeter",
    title: "Resources, Documents and Material Continuity",
    role:
      "Protects the material base of work: documents, resources, continuity, inventory and operational sustenance.",
    domains: ["documents", "resources", "continuity", "inventory", "operations"],
    operationalStatus: "DESIGNED_NEXT",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: true,
    requiresApprovalFor: ["move_file", "delete_files", "financial_decision"],
    limits: ["Cannot alter critical resources without approval."],
    boundary:
      "Demeter keeps the work supplied and ordered. Destructive or financially consequential actions remain gated."
  },

  themis: {
    id: "themis",
    name: "Themis",
    title: "Rules, Gates and Permissions",
    role:
      "Governance, permissions, approval gates, cost controls, licensing boundaries and procedure.",
    domains: ["approval", "policy", "governance", "compliance", "permissions", "licensing"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "internal_absorbed",
    absorbedInto: INTERNAL_ABSORBED_FUNCTIONS.themis,
    canAdvise: true,
    canExecute: true,
    requiresApprovalFor: ["approval_change", "policy_change"],
    limits: [
      "Cannot bypass Miguel approval.",
      "Blocks paid APIs by default.",
      "Blocks public tunnels by default.",
      "Blocks contamination of AtelierOS by incompatible code or licences."
    ],
    boundary:
      "Themis decides whether an action is allowed, blocked or approval-gated."
  },

  ares: {
    id: "ares",
    name: "Ares",
    title: "Risk and Adversarial Review",
    role:
      "Contradiction, risk analysis, threat modelling, objections, failure modes and adversarial review.",
    domains: ["risk", "security", "critique", "conflict", "threat-model"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: [],
    limits: ["Advisory only. Does not execute actions."],
    boundary:
      "Ares asks what can go wrong. He does not judge final quality and does not approve."
  },

  artemis: {
    id: "artemis",
    name: "Artemis",
    title: "Precision Watch and Discreet Observation",
    role:
      "Collects signals with precision, performs quiet watch, tracks patterns and avoids noisy over-monitoring.",
    domains: ["watch", "signals", "precision", "observation", "pattern-detection"],
    operationalStatus: "DESIGNED_NEXT",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: true,
    requiresApprovalFor: ["external_monitoring", "browser_control"],
    limits: ["Cannot create noisy watchers or uncontrolled external observation."],
    boundary:
      "Artemis watches carefully and selectively. She does not open uncontrolled external monitoring."
  },

  aphrodite: {
    id: "aphrodite",
    name: "Aphrodite",
    title: "Desirability, Appeal and Human Connection",
    role:
      "Shapes desirability, first impression, perceived value and human resonance of interfaces and communication.",
    domains: ["ux", "appeal", "first-impression", "human-connection", "desirability"],
    operationalStatus: "DESIGNED_NEXT",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: ["publish_content", "design_system_change"],
    limits: ["Does not publish, ship or enforce design changes directly."],
    boundary:
      "Aphrodite improves attraction and resonance, but she does not control final product or publication decisions."
  },

  harmonia: {
    id: "harmonia",
    name: "Harmonia",
    title: "Quality, Coherence and Final Review",
    role:
      "Reviews clarity, coherence, completeness, contradictions, ambiguity and readiness before outputs are submitted to Miguel.",
    domains: ["quality", "coherence", "review", "qa", "clarity", "readiness"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "internal_absorbed",
    absorbedInto: INTERNAL_ABSORBED_FUNCTIONS.harmonia,
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: [],
    limits: [
      "Does not approve.",
      "Does not apply changes.",
      "Does not replace Ares, Themis or ZEUS."
    ],
    boundary:
      "Harmonia asks whether the output is clear, coherent and ready for the Supreme Tribunal."
  },

  mnemosyne: {
    id: "mnemosyne",
    name: "Mnemosyne",
    title: "Internal Memory and Knowledge",
    role:
      "Internal memory, lessons, decisions, reports, candidates, entity history, Obsidian-linked notes and recovered context.",
    domains: ["memory", "knowledge", "decisions", "lessons", "entities", "history", "obsidian"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "internal_absorbed",
    absorbedInto: INTERNAL_ABSORBED_FUNCTIONS.mnemosyne,
    canAdvise: true,
    canExecute: true,
    requiresApprovalFor: ["memory_delete", "source_trust_change", "critical_memory_rewrite"],
    limits: ["Cannot delete or rewrite critical memory without approval."],
    boundary:
      "Mnemosyne works inside the system. She stores, links and retrieves internal memory already ingested."
  },

  hephaestus: {
    id: "hephaestus",
    name: "Hephaestus",
    title: "Build, Engineering and Patches",
    role:
      "Code, build pipelines, automations, technical implementation, tests, patch candidates and validation reports.",
    domains: ["code", "build", "automation", "engineering", "pipeline", "patches", "tests"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: true,
    requiresApprovalFor: ["file_write", "core_apply", "git_commit", "git_push", "dependency_install"],
    limits: ["Cannot apply to core without explicit approval and gates."],
    boundary:
      "Hephaestus builds and prepares candidates. He does not decide final application."
  },

  argus: {
    id: "argus",
    name: "Argus",
    title: "External Intelligence and Watch",
    role:
      "External intelligence, competitors, public sources, GitHub, tools, AI trends, regulation watch and market signals.",
    domains: ["external-intelligence", "monitoring", "competitors", "github", "tools", "regulation", "watchers"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "internal_absorbed",
    absorbedInto: INTERNAL_ABSORBED_FUNCTIONS.argus,
    canAdvise: true,
    canExecute: true,
    requiresApprovalFor: ["new_watcher", "external_monitoring", "public_source_ingest"],
    limits: ["Cannot create noisy watchers without approval."],
    boundary:
      "Argus works outside the system. He searches and observes external sources. Mnemosyne stores processed memory."
  },

  hermes: {
    id: "hermes",
    name: "Hermes",
    title: "Communication, Inbox and Tickets",
    role:
      "Emails, messages, tickets, inbox triage, follow-ups and communication workflows.",
    domains: ["email", "communication", "inbox", "messages", "follow-up", "tickets", "support"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: true,
    requiresApprovalFor: ["send_email", "archive_email", "delete_email", "external_message"],
    limits: ["Cannot send, delete or archive communications without approval."],
    boundary:
      "Hermes may prepare communication drafts. Miguel approves external sending."
  },

  hestia: {
    id: "hestia",
    name: "Hestia",
    title: "Operational Hearth, Memory and System Continuity",
    role:
      "Protects the inner centre of the system: session continuity, entity graph, memory governance, timeline intelligence and operational summaries. Provides cognitive synthesis from raw operational data.",
    domains: [
      "session-continuity", "entity-graph", "memory-governance",
      "timeline-intelligence", "operational-summary", "objectives",
      "decisions", "blockers", "system-health"
    ],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: true,
    requiresApprovalFor: ["critical_memory_rewrite", "memory_delete"],
    limits: [
      "Cannot rewrite critical system memory without approval.",
      "Cannot modify the entity graph directly — only scan and report.",
      "Governance checks are advisory; human decides on cleanup actions."
    ],
    boundary:
      "Hestia keeps the centre stable, the memory warm, and the context coherent. She scans, tracks, synthesises and warns — but does not rewrite critical memory without gate."
  },

  athena: {
    id: "athena",
    name: "Athena",
    title: "Strategy, Priorities and Decision Criteria",
    role:
      "Clarifies strategic options, trade-offs, prioritisation criteria, timing and focus. Does not perform final deliberation.",
    domains: ["strategy", "business", "planning", "priority", "decision-criteria", "vision"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: ["project_creation", "roadmap_change"],
    limits: [
      "Does not execute files or commands.",
      "Does not replace ZEUS final deliberation."
    ],
    boundary:
      "Athena proposes criteria and strategic framing. ZEUS deliberates. Miguel decides."
  },

  daedalus: {
    id: "daedalus",
    name: "Daedalus",
    title: "Product, UX and Systems",
    role: "Product architecture, UX/UI, systems design, workflows and prototypes.",
    domains: ["product", "ux", "ui", "systems", "architecture", "prototype"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "internal_absorbed",
    absorbedInto: INTERNAL_ABSORBED_FUNCTIONS.daedalus,
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: ["design_system_change", "product_scope_change"],
    limits: ["Does not implement production UI directly."],
    boundary:
      "Daedalus designs product systems and UX when activated by ZEUS."
  },

  apollo: {
    id: "apollo",
    name: "Apollo",
    title: "Communication, Narrative and Positioning",
    role: "Marketing strategy, copy, content, positioning, brand and public communication.",
    domains: ["marketing", "copy", "content", "brand", "communication", "positioning"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "classical_12",
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: ["publish_content", "send_campaign"],
    limits: ["Does not publish or send external communications without approval."],
    boundary:
      "Apollo prepares narrative and communication. He does not publish."
  },

  plutus: {
    id: "plutus",
    name: "Plutus",
    title: "Finance and Economic Reasoning",
    role: "Financial analysis, cashflow, investment framing, scenarios, pricing and economic risk.",
    domains: ["finance", "investment", "cashflow", "pricing", "scenario-analysis"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "internal_absorbed",
    absorbedInto: INTERNAL_ABSORBED_FUNCTIONS.plutus,
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: ["financial_decision", "investment_action"],
    limits: ["Does not provide regulated financial advice or execute transactions."],
    boundary:
      "Plutus analyses financial implications. Miguel decides economic action."
  },

  prometheus: {
    id: "prometheus",
    name: "Prometheus",
    title: "Innovation and Future Systems",
    role: "Research, invention, emerging technology, speculative opportunities and future systems.",
    domains: ["innovation", "research", "future", "ai", "emerging-technology"],
    operationalStatus: "ACTIVE_NOW",
    canonicalStatus: "internal_absorbed",
    absorbedInto: INTERNAL_ABSORBED_FUNCTIONS.prometheus,
    canAdvise: true,
    canExecute: false,
    requiresApprovalFor: ["new_research_track"],
    limits: ["Ideas must be validated by ZEUS, Ares and Themis before execution."],
    boundary:
      "Prometheus explores possibilities. He does not start new fronts without approval."
  }
};

export function getAgentsByIds(agentIds: string[]): OlympusAgent[] {
  return agentIds
    .map((id) => olympusAgents[id])
    .filter(Boolean);
}

export function getAgentsByOperationalStatus(
  status: OperationalStatus
): OlympusAgent[] {
  return Object.values(olympusAgents).filter(
    (agent) => agent.operationalStatus === status
  );
}

export function getCanonicalOlympusAgents(): OlympusAgent[] {
  return Object.values(olympusAgents).filter(
    (agent) => agent.canonicalStatus === "classical_12"
  );
}
