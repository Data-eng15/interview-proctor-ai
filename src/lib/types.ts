export type Severity = "low" | "medium" | "high" | "critical";

export type ViolationType =
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "LOOKING_AWAY"
  | "PHONE_DETECTED"
  | "EXTRA_PERSON"
  | "BOOK_DETECTED"
  | "LIP_SYNC_MISMATCH"
  | "BACKGROUND_VOICE"
  | "TAB_SWITCH"
  | "FULLSCREEN_EXIT";

export interface ViolationMeta {
  label: string;
  severity: Severity;
  weight: number; // integrity-score penalty per occurrence
  icon: string;
  /** frames/ticks the condition must persist before it is logged */
  debounce: number;
  description: string;
}

export interface ProctorEvent {
  id: string;
  type: ViolationType;
  at: number; // ms since session start
  wallClock: string; // HH:MM:SS
  detail?: string;
}

export interface LiveMetrics {
  faceCount: number;
  jawOpen: number; // 0..1 mouth-open blendshape
  gaze: "center" | "left" | "right" | "up" | "down" | "unknown";
  voiceLevel: number; // 0..1 rms
  voiceActive: boolean;
  objects: string[]; // detected COCO labels of interest
  personCount: number;
  fps: number;
  calibrating: boolean; // capturing neutral head-pose baseline
}

export type ProctorStatus =
  | "idle"
  | "requesting"
  | "loading"
  | "running"
  | "ended"
  | "error";

export interface SessionReport {
  durationMs: number;
  startedAt: string;
  endedAt: string;
  score: number;
  verdict: "clear" | "minor" | "high-risk";
  events: ProctorEvent[];
  counts: Record<ViolationType, number>;
}
