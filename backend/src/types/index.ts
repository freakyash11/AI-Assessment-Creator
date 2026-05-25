// ─────────────────────────────────────────────────────────────────────────────
// VedaAI — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Job Payloads ──────────────────────────────────────────────────────────────

export interface AssessmentJobPayload {
  assessmentId: string;
  subject: string;
  gradeLevel: string;
  numQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  userId?: string;
}

export interface PdfExportJobPayload {
  assessmentId: string;
  userId?: string;
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

export type WsEventType =
  | 'connection'
  | 'disconnection'
  | 'auth'
  | 'assessment:started'
  | 'assessment:progress'
  | 'assessment:completed'
  | 'assessment:failed'
  | 'job:started'
  | 'job:completed'
  | 'job:failed'
  | 'error'
  | 'ping'
  | 'pong';

export interface WsMessage<T = unknown> {
  type: WsEventType;
  payload?: T;
  timestamp?: string;
  [key: string]: any;
}

export interface WsClientMeta {
  clientId: string;
  connectedAt: Date;
  userId?: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

// ── Assessment ────────────────────────────────────────────────────────────────

export type AssessmentStatus = 'pending' | 'generating' | 'ready' | 'failed';

export type QuestionType = 'mcq' | 'short-answer' | 'true-false' | 'essay';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  marks: number;
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export interface AppError extends Error {
  statusCode?: number;
}
