import type { SupabaseClient } from "@supabase/supabase-js";

export type AiJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type AiJobRow = {
  id: string;
  salon_id: string;
  session_id: string;
  status: AiJobStatus;
  provider: string;
  model: string;
  model_owner: string | null;
  model_name: string | null;
  requested_version: string | null;
  asset_version: string | null;
  external_prediction_id: string | null;
  reported_model_version: string | null;
  prompt_version: string;
  input_parameters_json: Record<string, unknown>;
  estimated_cost_usd: number | null;
  latency_ms: number | null;
  error_code: string | null;
  source_image_path: string;
  reference_image_path: string;
  result_image_path: string | null;
  pending_result_url: string | null;
  consent_policy_version: string;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type AiJob = {
  id: string;
  salonId: string;
  sessionId: string;
  status: AiJobStatus;
  provider: string;
  model: string;
  modelOwner?: string;
  modelName?: string;
  requestedVersion?: string;
  assetVersion?: string;
  externalPredictionId?: string;
  reportedModelVersion?: string;
  promptVersion: string;
  inputParameters: Record<string, unknown>;
  estimatedCostUsd?: number;
  latencyMs?: number;
  errorCode?: string;
  sourceImagePath: string;
  referenceImagePath: string;
  resultImagePath?: string;
  pendingResultUrl?: string;
  consentPolicyVersion: string;
  ipHash?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};

export type CreateAiJobInput = {
  id: string;
  salonId: string;
  sessionId: string;
  status: AiJobStatus;
  provider: string;
  model: string;
  modelOwner?: string;
  modelName?: string;
  requestedVersion?: string;
  assetVersion?: string;
  externalPredictionId?: string;
  reportedModelVersion?: string;
  promptVersion: string;
  inputParameters?: Record<string, unknown>;
  estimatedCostUsd?: number;
  sourceImagePath: string;
  referenceImagePath: string;
  consentPolicyVersion: string;
  ipHash?: string;
};

const AI_JOB_COLUMNS =
  "id,salon_id,session_id,status,provider,model,model_owner,model_name,requested_version,asset_version,external_prediction_id,reported_model_version,prompt_version,input_parameters_json,estimated_cost_usd,latency_ms,error_code,source_image_path,reference_image_path,result_image_path,pending_result_url,consent_policy_version,ip_hash,created_at,updated_at,completed_at";

export function mapAiJobRow(row: AiJobRow): AiJob {
  return {
    id: row.id,
    salonId: row.salon_id,
    sessionId: row.session_id,
    status: row.status,
    provider: row.provider,
    model: row.model,
    modelOwner: row.model_owner ?? undefined,
    modelName: row.model_name ?? undefined,
    requestedVersion: row.requested_version ?? undefined,
    assetVersion: row.asset_version ?? undefined,
    externalPredictionId: row.external_prediction_id ?? undefined,
    reportedModelVersion: row.reported_model_version ?? undefined,
    promptVersion: row.prompt_version,
    inputParameters: row.input_parameters_json ?? {},
    estimatedCostUsd: row.estimated_cost_usd ?? undefined,
    latencyMs: row.latency_ms ?? undefined,
    errorCode: row.error_code ?? undefined,
    sourceImagePath: row.source_image_path,
    referenceImagePath: row.reference_image_path,
    resultImagePath: row.result_image_path ?? undefined,
    pendingResultUrl: row.pending_result_url ?? undefined,
    consentPolicyVersion: row.consent_policy_version,
    ipHash: row.ip_hash ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export function toAiJobInsertRow(input: CreateAiJobInput) {
  const now = new Date().toISOString();
  return {
    id: input.id,
    salon_id: input.salonId,
    session_id: input.sessionId,
    status: input.status,
    provider: input.provider,
    model: input.model,
    model_owner: input.modelOwner ?? null,
    model_name: input.modelName ?? null,
    requested_version: input.requestedVersion ?? null,
    asset_version: input.assetVersion ?? null,
    external_prediction_id: input.externalPredictionId ?? null,
    reported_model_version: input.reportedModelVersion ?? null,
    prompt_version: input.promptVersion,
    input_parameters_json: input.inputParameters ?? {},
    estimated_cost_usd: input.estimatedCostUsd ?? null,
    source_image_path: input.sourceImagePath,
    reference_image_path: input.referenceImagePath,
    consent_policy_version: input.consentPolicyVersion,
    ip_hash: input.ipHash ?? null,
    created_at: now,
    updated_at: now,
  };
}

export async function insertAiJob(
  client: SupabaseClient,
  input: CreateAiJobInput,
): Promise<AiJob> {
  const { data, error } = await client
    .from("ai_jobs")
    .insert(toAiJobInsertRow(input))
    .select(AI_JOB_COLUMNS)
    .single();
  if (error) throw error;
  return mapAiJobRow(data as AiJobRow);
}

export async function getAiJobById(
  client: SupabaseClient,
  salonId: string,
  jobId: string,
): Promise<AiJob | null> {
  const { data, error } = await client
    .from("ai_jobs")
    .select(AI_JOB_COLUMNS)
    .eq("salon_id", salonId)
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAiJobRow(data as AiJobRow) : null;
}

export async function getAiJobByExternalPredictionId(
  client: SupabaseClient,
  salonId: string,
  externalPredictionId: string,
): Promise<AiJob | null> {
  const { data, error } = await client
    .from("ai_jobs")
    .select(AI_JOB_COLUMNS)
    .eq("salon_id", salonId)
    .eq("external_prediction_id", externalPredictionId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAiJobRow(data as AiJobRow) : null;
}

export async function updateAiJob(
  client: SupabaseClient,
  salonId: string,
  jobId: string,
  patch: {
    status?: AiJobStatus;
    errorCode?: string | null;
    resultImagePath?: string | null;
    pendingResultUrl?: string | null;
    externalPredictionId?: string | null;
    reportedModelVersion?: string | null;
    latencyMs?: number | null;
    completedAt?: Date | null;
  },
): Promise<AiJob> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.errorCode !== undefined) row.error_code = patch.errorCode;
  if (patch.resultImagePath !== undefined) {
    row.result_image_path = patch.resultImagePath;
  }
  if (patch.pendingResultUrl !== undefined) {
    row.pending_result_url = patch.pendingResultUrl;
  }
  if (patch.externalPredictionId !== undefined) {
    row.external_prediction_id = patch.externalPredictionId;
  }
  if (patch.reportedModelVersion !== undefined) {
    row.reported_model_version = patch.reportedModelVersion;
  }
  if (patch.latencyMs !== undefined) row.latency_ms = patch.latencyMs;
  if (patch.completedAt !== undefined) {
    row.completed_at = patch.completedAt
      ? patch.completedAt.toISOString()
      : null;
  }

  const { data, error } = await client
    .from("ai_jobs")
    .update(row)
    .eq("salon_id", salonId)
    .eq("id", jobId)
    .select(AI_JOB_COLUMNS)
    .single();
  if (error) throw error;
  return mapAiJobRow(data as AiJobRow);
}

export async function hasActiveJobForSession(
  client: SupabaseClient,
  salonId: string,
  sessionId: string,
): Promise<boolean> {
  const { count, error } = await client
    .from("ai_jobs")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .eq("session_id", sessionId)
    .in("status", ["QUEUED", "RUNNING"]);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export function isTerminalAiJobStatus(status: AiJobStatus): boolean {
  return status === "SUCCEEDED" || status === "FAILED";
}

export type AiJobMonthlyStats = {
  total: number;
  succeeded: number;
  failed: number;
  inProgress: number;
  estimatedCostUsd: number;
};

export async function getAiJobMonthlyStats(
  client: SupabaseClient,
  salonId: string,
  monthKeyValue: string,
): Promise<AiJobMonthlyStats> {
  const monthStart = `${monthKeyValue}-01T00:00:00.000Z`;
  const [year, month] = monthKeyValue.split("-").map(Number);
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEnd = `${nextMonth}-01T00:00:00.000Z`;

  const { data, error } = await client
    .from("ai_jobs")
    .select("status, estimated_cost_usd")
    .eq("salon_id", salonId)
    .gte("created_at", monthStart)
    .lt("created_at", monthEnd);
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    status: AiJobStatus;
    estimated_cost_usd: number | null;
  }>;

  let succeeded = 0;
  let failed = 0;
  let inProgress = 0;
  let estimatedCostUsd = 0;

  for (const row of rows) {
    if (row.status === "SUCCEEDED") {
      succeeded += 1;
      estimatedCostUsd += row.estimated_cost_usd ?? 0;
    } else if (row.status === "FAILED") {
      failed += 1;
    } else {
      inProgress += 1;
    }
  }

  return {
    total: rows.length,
    succeeded,
    failed,
    inProgress,
    estimatedCostUsd,
  };
}

export function extractReplicateOutput(
  output: string | string[] | null | undefined,
): string | undefined {
  if (typeof output === "string") {
    return output;
  }
  if (Array.isArray(output) && typeof output[0] === "string") {
    return output[0];
  }
  return undefined;
}
