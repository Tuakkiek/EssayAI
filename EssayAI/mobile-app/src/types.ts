export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export type EssayTaskType = "task1" | "task2";

export interface ScoreRequest {
  essayText: string;
  prompt?: string;
  taskType?: "task1" | "task2";
  userId?: string;
  centerId?: string;
}

export interface ScoreBreakdown {
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
}

export interface GrammarError {
  original: string;
  corrected: string;
  explanation: string;
  position?: number;
  tip?: string;
}

export interface Suggestion {
  category: "vocabulary" | "structure" | "coherence" | "argument" | "general";
  text: string;
  example?: string;
}

export interface ScoreResponse {
  essayId: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  grammarErrors: GrammarError[];
  suggestions: Suggestion[];
  aiFeedback: string;
  wordCount: number;
  taskType: "task1" | "task2";
  processingTimeMs: number;
  createdAt: string;
}

export interface Essay {
  _id: string;
  userId: string;
  centerId?: string;
  prompt: string;
  essayText: string;
  wordCount: number;
  taskType: "task1" | "task2";
  status: "pending" | "scoring" | "scored" | "error";
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  grammarErrors?: GrammarError[];
  suggestions?: Suggestion[];
  aiFeedback?: string;
  aiModel?: string;
  processingTimeMs?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedHistory {
  essays: Essay[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Lightweight essay summary used in the History list. */
export interface HistoryItem {
  _id: string;
  userId: string;
  centerId?: string;
  text?: string;
  originalText?: string;
  wordCount: number;
  taskType: "task1" | "task2";
  status: "pending" | "scoring" | "scored" | "error";
  score?: number;
  createdAt: string;
  updatedAt: string;
}
