import axios, { AxiosError, AxiosInstance } from "axios"
import { ApiResponse, ScoreRequest, ScoreResponse, PaginatedHistory, Essay } from "../types"
import { API_BASE_URL } from "../config/api"

// ── Client ────────────────────────────────────────────────────────
export const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90_000,   // AI scoring can take up to ~60s
  headers: { "Content-Type": "application/json" },
})

// ── Error helper ──────────────────────────────────────────────────
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse<unknown> | undefined
    return data?.message ?? error.message ?? "Network error"
  }
  if (error instanceof Error) return error.message
  return "Unknown error"
}

// ── Essay API ─────────────────────────────────────────────────────
export const essayApi = {
  /** Submit essay for AI scoring — returns full score result */
  score: async (payload: ScoreRequest): Promise<ScoreResponse> => {
    const res = await client.post<ApiResponse<ScoreResponse>>("/essay/score", payload)
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Scoring failed")
    }
    return res.data.data
  },

  /** Get paginated essay history for a user */
  getHistory: async (
    userId: string,
    params?: { page?: number; limit?: number; status?: string; sortBy?: string }
  ): Promise<PaginatedHistory> => {
    const res = await client.get<ApiResponse<PaginatedHistory>>("/essay/history", {
      params: { userId, ...params },
    })
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Failed to load history")
    }
    return res.data.data
  },

  /** Get full essay detail by ID */
  getById: async (essayId: string, userId?: string): Promise<Essay> => {
    const res = await client.get<ApiResponse<Essay>>(`/essay/${essayId}`, {
      params: userId ? { userId } : undefined,
    })
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Essay not found")
    }
    return res.data.data
  },

  /** Delete an essay */
  delete: async (essayId: string, userId: string): Promise<void> => {
    await client.delete(`/essay/${essayId}`, { params: { userId } })
  },
}

// ── Health check ──────────────────────────────────────────────────
export const healthApi = {
  check: async (): Promise<boolean> => {
    try {
      const res = await client.get("/health", { timeout: 5000 })
      return res.data?.status === "ok"
    } catch {
      return false
    }
  },
}

export { getErrorMessage }
