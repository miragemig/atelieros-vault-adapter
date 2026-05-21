export type TaskClassification =
  | "surgical_patch"
  | "module_generation"
  | "patch_candidate_review"
  | "patch_candidate_apply"
  | "typescript_error"
  | "semantic_error"
  | "missing_file"
  | "stale_candidate"
  | "validation_failed"
  | "unsupported_task";

export type RecommendedWorker =
  | "surgical_patch_worker"
  | "build_pipeline"
  | "patch_candidate_review"
  | "patch_candidate_apply"
  | "block_and_request_human";

export type ClassifierInput = {
  id?: string;
  title?: string;
  requirements?: string[];
  errorText?: string;
  targetFiles?: string[];
  candidateStatus?: string;
};

export type ClassifierResult = {
  classification: TaskClassification;
  recommendedWorker: RecommendedWorker;
  confidence: "low" | "medium" | "high";
  reasons: string[];
};

function text(input: ClassifierInput): string {
  return [
    input.id || "",
    input.title || "",
    ...(input.requirements || []),
    input.errorText || "",
    ...(input.targetFiles || []),
    input.candidateStatus || ""
  ]
    .join(" ")
    .toLowerCase();
}

function hasAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term.toLowerCase()));
}

export function classifyPatchOrBuildTask(input: ClassifierInput): ClassifierResult {
  const value = text(input);
  const reasons: string[] = [];

  if (
    hasAny(value, [
      "stale",
      "before.ts no longer matches",
      "current target file no longer matches",
      "candidate is stale"
    ])
  ) {
    reasons.push("Detected stale candidate indicators.");
    return {
      classification: "stale_candidate",
      recommendedWorker: "patch_candidate_review",
      confidence: "high",
      reasons
    };
  }

  if (
    hasAny(value, [
      "metadata.json missing",
      "target file not found",
      "cannot find module",
      "enoent",
      "missing file"
    ])
  ) {
    reasons.push("Detected missing file or missing candidate metadata.");
    return {
      classification: "missing_file",
      recommendedWorker: "block_and_request_human",
      confidence: "high",
      reasons
    };
  }

  if (
    hasAny(value, [
      "result: fail",
      "validation failed",
      "validate-after",
      "buildpipeline returned non-zero",
      "non-zero exit code"
    ])
  ) {
    reasons.push("Detected validation failure.");
    return {
      classification: "validation_failed",
      recommendedWorker: "block_and_request_human",
      confidence: "medium",
      reasons
    };
  }

  if (
    hasAny(value, [
      "typescript",
      "ts2322",
      "ts2304",
      "ts2345",
      "type error",
      "cannot assign",
      "property does not exist"
    ])
  ) {
    reasons.push("Detected TypeScript/type-checking error.");
    return {
      classification: "typescript_error",
      recommendedWorker: "build_pipeline",
      confidence: "medium",
      reasons
    };
  }

  if (
    hasAny(value, [
      "semantic",
      "wrong behavior",
      "expected behavior",
      "does not behave",
      "logic error"
    ])
  ) {
    reasons.push("Detected semantic/behavioral issue.");
    return {
      classification: "semantic_error",
      recommendedWorker: "surgical_patch_worker",
      confidence: "medium",
      reasons
    };
  }

  if (
    hasAny(value, [
      "patch candidate",
      "waiting_review",
      "review candidate",
      "metadata",
      "patch.diff",
      "validation.md"
    ])
  ) {
    reasons.push("Detected patch candidate review context.");
    return {
      classification: "patch_candidate_review",
      recommendedWorker: "patch_candidate_review",
      confidence: "high",
      reasons
    };
  }

  if (
    hasAny(value, [
      "apply patch",
      "apply candidate",
      "approved-by miguel",
      "approved by miguel"
    ])
  ) {
    reasons.push("Detected patch application context.");
    return {
      classification: "patch_candidate_apply",
      recommendedWorker: "patch_candidate_apply",
      confidence: "high",
      reasons
    };
  }

  if (
    hasAny(value, [
      "fix ",
      "bug",
      "formatting",
      "small bug",
      "existing file",
      "target file",
      "expected behavior",
      "surgical",
      "risk formatting",
      "one line",
      "newline"
    ])
  ) {
    reasons.push("Detected small fix / existing-file patch indicators.");
    return {
      classification: "surgical_patch",
      recommendedWorker: "surgical_patch_worker",
      confidence: "high",
      reasons
    };
  }

  if (
    hasAny(value, [
      "create module",
      "create parser",
      "new module",
      "generate module",
      "draft module",
      "build module",
      "implement module"
    ])
  ) {
    reasons.push("Detected new module generation indicators.");
    return {
      classification: "module_generation",
      recommendedWorker: "build_pipeline",
      confidence: "high",
      reasons
    };
  }

  reasons.push("No reliable classification rule matched.");

  return {
    classification: "unsupported_task",
    recommendedWorker: "block_and_request_human",
    confidence: "low",
    reasons
  };
}

function main() {
  const raw = process.argv.slice(2).join(" ");

  if (!raw) {
    throw new Error("Usage: patchErrorClassifier.ts <text-to-classify>");
  }

  const result = classifyPatchOrBuildTask({
    title: raw,
    requirements: [raw],
    errorText: raw
  });

  console.log(JSON.stringify(result, null, 2));
}

main();
