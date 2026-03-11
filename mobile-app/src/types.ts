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
  grammaticalRange: number;
}

export interface GrammarError {
  original: string;
  correction: string;
  explanation: string;
  ruleFull?: string;
  tip?: string;
}

export interface Suggestion {
  category: "structure" | "vocabulary" | "tone" | "other" | string;
  point: string;
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
  status: "pending" | "scoring" | "completed" | "error";
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
