// ─── REST API client for VedaAI backend ───

import type {
  ApiResponse,
  Assignment,
  AssignmentCreatedData,
  JobTriggeredData,
  GetResultResponse,
} from "@/types/exam";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ─── Helpers ───

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || json.success === false) {
    const message =
      json.error ?? json.details?.map((d: { message: string }) => d.message).join(", ") ?? "Request failed";
    throw new Error(message);
  }
  return json as T;
}

// ─── Endpoints ───

/** POST /api/assignments — create a new assignment (multipart/form-data) */
export async function createAssignment(
  formData: FormData
): Promise<AssignmentCreatedData> {
  const res = await fetch(`${BASE_URL}/api/assignments`, {
    method: "POST",
    body: formData, // browser sets Content-Type with boundary automatically
  });
  const json = await handleResponse<ApiResponse<AssignmentCreatedData>>(res);
  return json.data;
}

/** POST /api/assignments/:id/generate — enqueue LLM generation job */
export async function triggerGeneration(
  assignmentId: string
): Promise<JobTriggeredData> {
  const res = await fetch(
    `${BASE_URL}/api/assignments/${assignmentId}/generate`,
    { method: "POST" }
  );
  const json = await handleResponse<ApiResponse<JobTriggeredData>>(res);
  return json.data;
}

/** GET /api/assignments/:id/result — fetch generated question paper */
export async function getResult(
  assignmentId: string
): Promise<GetResultResponse> {
  const res = await fetch(
    `${BASE_URL}/api/assignments/${assignmentId}/result`
  );
  const json = await handleResponse<GetResultResponse>(res);
  return json;
}

/** GET /api/assignments — list all assignments */
export async function listAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${BASE_URL}/api/assignments`);
  const json = await handleResponse<ApiResponse<Assignment[]>>(res);
  return json.data;
}



/** DELETE /api/assignments/:id — delete an assignment */
export async function deleteAssignment(
  assignmentId: string
): Promise<{ assignmentId: string }> {
  const res = await fetch(
    `${BASE_URL}/api/assignments/${assignmentId}`,
    { method: "DELETE" }
  );
  const json = await handleResponse<ApiResponse<{ assignmentId: string }>>(res);
  return json.data;
}
