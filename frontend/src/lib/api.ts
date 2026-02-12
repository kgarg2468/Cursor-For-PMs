const API_BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

// Data APIs
export interface DatasetResponse {
  id: string;
  name: string;
  filename: string;
  row_count: number | null;
  columns: string[] | null;
  created_at: string | null;
}

export interface DatasetDetailResponse extends DatasetResponse {
  sample_rows: Record<string, unknown>[];
  schema_info: Record<string, unknown> | null;
}

export interface UploadResponse {
  dataset: DatasetResponse;
  preview: Record<string, unknown>[];
  columns: string[];
  row_count: number;
}

export type InsightType =
  | "alert"
  | "opportunity"
  | "trend"
  | "anomaly"
  | "correlation"
  | "segment"
  | "feature_adoption"
  | "revenue_attribution";

export interface InsightResponse {
  id: string;
  dataset_id: string;
  type: InsightType;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  impact_revenue: number | null;
  impact_customers: number | null;
  confidence: number | null;
  chart_data: Record<string, unknown> | null;
  ai_reasoning: string | null;
  impact_score: number | null;
  suggested_questions: string[] | null;
  dismissed: boolean;
  created_at: string | null;
}

export interface ExpandInsightResponse {
  insight_id: string;
  ai_reasoning: string;
}

export interface SimulationResponse {
  id: string;
  dataset_id: string;
  feature_name: string;
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
  recommendation: string | null;
  confidence: number | null;
  created_at: string | null;
}

export interface ConversationResponse {
  id: string;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  thinking: string[] | null;
  pinned_context: string[] | null;
  created_at: string | null;
}

export interface ConversationDetailResponse extends ConversationResponse {
  messages: MessageResponse[];
}

// Data endpoints
export const dataApi = {
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/data/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || "Upload failed");
    }
    return res.json();
  },

  loadDemo: () => request<UploadResponse>("/data/demo", { method: "POST" }),

  list: () => request<DatasetResponse[]>("/data/datasets"),

  get: (id: string) => request<DatasetDetailResponse>(`/data/datasets/${id}`),

  delete: (id: string) =>
    request<{ status: string }>(`/data/datasets/${id}`, { method: "DELETE" }),
};

// Insights endpoints
export const insightsApi = {
  list: (datasetId: string, typeFilter?: string, sortBy?: string) => {
    const params = new URLSearchParams({ dataset_id: datasetId });
    if (typeFilter) params.set("type_filter", typeFilter);
    if (sortBy) params.set("sort_by", sortBy);
    return request<InsightResponse[]>(`/insights?${params.toString()}`);
  },

  get: (id: string) => request<InsightResponse>(`/insights/${id}`),

  dismiss: (id: string) =>
    request<{ status: string }>(`/insights/${id}/dismiss`, { method: "PATCH" }),

  expand: (id: string) =>
    request<ExpandInsightResponse>(`/insights/${id}/expand`, { method: "POST" }),

  kpis: (datasetId: string) =>
    request<Record<string, unknown>>(`/insights/kpis?dataset_id=${datasetId}`),

  generateUrl: (datasetId: string) =>
    `${API_BASE}/insights/generate?dataset_id=${datasetId}`,
};

// Simulations endpoints
export const simulationsApi = {
  list: (datasetId: string) =>
    request<SimulationResponse[]>(`/simulations?dataset_id=${datasetId}`),

  get: (id: string) => request<SimulationResponse>(`/simulations/${id}`),

  runUrl: (datasetId: string, featureName: string) =>
    `${API_BASE}/simulations/run?dataset_id=${datasetId}&feature_name=${encodeURIComponent(featureName)}`,

  runGraphUrl: () => `${API_BASE}/simulations/run-graph`,
};

// Chat endpoints
export const chatApi = {
  createConversation: (title?: string) =>
    request<ConversationResponse>("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  listConversations: () =>
    request<ConversationResponse[]>("/chat/conversations"),

  getConversation: (id: string) =>
    request<ConversationDetailResponse>(`/chat/conversations/${id}`),

  sendMessage: (conversationId: string, content: string, pinnedContext?: string[]) =>
    request<MessageResponse>(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, pinned_context: pinnedContext }),
    }),

  deleteConversation: (id: string) =>
    request<{ status: string }>(`/chat/conversations/${id}`, { method: "DELETE" }),

  streamUrl: (conversationId: string) =>
    `${API_BASE}/chat/conversations/${conversationId}/stream`,

  streamBody: (content: string, pinnedContext?: string[]): Record<string, unknown> => ({
    content,
    ...(pinnedContext?.length ? { pinned_context: pinnedContext } : {}),
  }),
};
