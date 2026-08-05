const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (e) {
    throw new ApiError(
      "Couldn't reach the ScamShield API. Is the backend running (uvicorn main:app --reload)?",
      0
    );
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* noop */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

export const api = {
  scan: (url, useAI = true) =>
    request("/api/scan", {
      method: "POST",
      body: JSON.stringify({ url, use_ai_content_analysis: useAI }),
    }),
  getScan: (id) => request(`/api/scan/${id}`),
  history: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/history${q ? `?${q}` : ""}`);
  },
  stats: () => request("/api/stats"),
  health: () => request("/api/health"),
};

export { ApiError };
