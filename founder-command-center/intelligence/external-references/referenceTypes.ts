export type ExternalReferenceType =
  | "zip"
  | "video"
  | "repo"
  | "tool"
  | "competitor"
  | "article"
  | "manual_note";

export type LicenceRisk =
  | "unknown"
  | "low"
  | "medium"
  | "high"
  | "non_commercial_only"
  | "blocked_for_atelieros";

export type AtelierOSReusePolicy =
  | "patterns_only"
  | "clean_room_reimplementation_required"
  | "allowed_after_license_review"
  | "blocked";

export type ExternalReferenceInput = {
  id: string;
  title: string;
  type: ExternalReferenceType;
  sourceLabel: string;
  sourcePathOrUrl?: string;
  observedCapabilities: string[];
  usefulPatterns: string[];
  risks: string[];
  licenceRisk: LicenceRisk;
  atelierosReusePolicy: AtelierOSReusePolicy;
  forbiddenReuse: string[];
  possibleZeusTasks: string[];
  notes?: string;
};

export type ExternalReferenceRecord = ExternalReferenceInput & {
  createdAt: string;
  status: "recorded";
};
