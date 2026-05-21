export type SurgicalPatchTask = {
  id: string;
  title: string;
  targetFiles: string[];
  bugDescription: string;
  expectedBehavior: string;
  reproductionCommand: string;
  validationCommand?: string;
  forbiddenActions: string[];
  approvalRequired: boolean;
};

export type PatchCandidateMetadata = {
  candidateId: string;
  taskId: string;
  title: string;
  createdAt: string;
  targetFiles: string[];
  status: "waiting_review";
  approvalRequired: true;
  forbiddenActions: string[];
  summary: string;
};
