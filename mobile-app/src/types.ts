export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Essay status — add "graded" to match backend, keep "scored" for compatibility
export type EssayStatus =
  | "pending"
  | "scoring"
  | "grading"
  | "graded"
  | "scored"
  | "error";

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

export interface Essay {
  _id: string;
  userId: string;
  centerId?: string | null;
  assignmentId?:
    | string
    | { _id: string; title?: string; taskType?: "task1" | "task2" }
    | null;

  // Backend may return either "text" or "originalText"
  text?: string;
  originalText?: string;
  textPreview?: string;

  prompt?: string;
  wordCount: number;
  status: EssayStatus;

  // Backend may return "overallBand", "score", or "overallScore"
  score?: number;
  overallScore?: number;
  overallBand?: number;

  scoreBreakdown?: ScoreBreakdown;
  grammarErrors?: GrammarError[];
  suggestions?: Suggestion[];

  // Backend may return "aiFeedback" or "feedback"
  aiFeedback?: string;
  feedback?: string;

  aiModel?: string;
  processingTimeMs?: number;
  errorMessage?: string;
  isReviewedByTeacher?: boolean;

  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "teacher" | "center_student" | "free_student";

export interface Class {
  _id: string;
  name: string;
  code: string;
  teacherId: string;
  studentIds: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface RequiredVocabulary {
  word: string;
  synonyms: string[];
  importance: "required" | "recommended";
}

export interface BandDescriptor {
  band: number;
  descriptor: string;
}

export interface GradingCriteria {
  overview?: string;
  requiredVocabulary?: RequiredVocabulary[];
  bandDescriptors?: BandDescriptor[];
  structureRequirements?: string;
  penaltyNotes?: string;
  additionalNotes?: string;
}

export interface Assignment {
  _id: string;
  title: string;
  description?: string;
  prompt: string;
  gradingCriteria?: GradingCriteria;
  classId: string;
  className?: string;
  teacherId: string;
  startDate?: string;
  dueDate: string;
  status: "draft" | "published" | "closed";
  maxAttempts: number;
  submissionCount?: number;
  mySubmission?: Essay | null;
  createdAt: string;
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  totalStudents: number;
  totalSubmissions: number;
  averageScore: number;
  submissionRate: number;
  scoreDistribution: { band: string; count: number }[];
  topStudents: { name: string; averageScore: number }[];
  recentSubmissions: {
    studentName: string;
    score: number;
    createdAt: string;
  }[];
}

/** Used in History list */
export interface HistoryItem extends Essay {}

export interface PaginatedHistory {
  essays: Essay[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ScoreRequest {
  essayText: string;
  prompt?: string;
  userId?: string;
  centerId?: string;
}

export interface ScoreResponse {
  essayId: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  grammarErrors: GrammarError[];
  suggestions: Suggestion[];
  aiFeedback: string;
  wordCount: number;
  processingTimeMs: number;
  createdAt: string;
}
