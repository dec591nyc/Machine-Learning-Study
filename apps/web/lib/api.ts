export type RecommendationRequest = {
  task: "regression" | "classification" | "clustering" | "reduction";
  data_type: "tabular" | "text" | "image" | "high-dimensional";
  sample_size: "small" | "medium" | "large";
  explainability: "low" | "medium" | "high";
  class_imbalance: boolean;
  latency_sensitive: boolean;
};

export type RecommendationResponse = {
  baseline: string;
  comparison: string;
  reasons: string[];
  risks: string[];
  metrics: string[];
  suggested_lab?: string | null;
};

export type ExperimentPoint = {
  x: number;
  y: number;
  label?: number | null;
  prediction?: number | null;
};

export type ExperimentResponse = {
  model: string;
  title: string;
  parameters: Record<string, string | number>;
  metrics: Record<string, number>;
  points: ExperimentPoint[];
  surface: ExperimentPoint[];
  centroids: ExperimentPoint[];
  diagnostic_codes: string[];
  explanation: string[];
  industry_note: string;
};

export type AiContext = {
  page: string;
  industry?: string | null;
  model?: string | null;
  parameters?: Record<string, string | number>;
  metrics?: Record<string, number>;
  diagnostic_codes?: string[];
};

export type AiMessage = {
  role: "user" | "model";
  content: string;
};

export type AiAnswer = {
  answer: string;
  model: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    let detail = body;
    try {
      const parsed = JSON.parse(body) as { detail?: string };
      detail = parsed.detail ?? body;
    } catch {
      // Keep the plain response body when the API did not return JSON.
    }
    throw new Error(detail || "API request failed");
  }
  return response.json() as Promise<T>;
}

export async function fetchRecommendation(payload: RecommendationRequest) {
  return parseResponse<RecommendationResponse>(
    await fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function fetchExperiment(model: string, primary: number, secondary: number) {
  return parseResponse<ExperimentResponse>(
    await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, primary, secondary, seed: 42 }),
    }),
  );
}

export async function askAi(question: string, context: AiContext, history: AiMessage[]) {
  return parseResponse<AiAnswer>(
    await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context, history: history.slice(-6) }),
    }),
  );
}
