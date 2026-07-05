import type { ViolationMeta, ViolationType } from "./types";

// `debounce` = consecutive detection frames (~30/s) a condition must persist
// before it is logged. Tuned conservatively to avoid false flags. Object-based
// conditions (phone/book/person) additionally require two-cycle confirmation in
// the detection loop, so their frame debounce can stay small.
export const VIOLATIONS: Record<ViolationType, ViolationMeta> = {
  MULTIPLE_FACES: {
    label: "Multiple faces",
    severity: "critical",
    weight: 20,
    icon: "👥",
    debounce: 25,
    description: "More than one face detected — possible impersonation help.",
  },
  PHONE_DETECTED: {
    label: "Phone in frame",
    severity: "critical",
    weight: 18,
    icon: "📱",
    debounce: 4,
    description: "A mobile phone was detected in the camera view.",
  },
  EXTRA_PERSON: {
    label: "Extra person",
    severity: "critical",
    weight: 18,
    icon: "🧍",
    debounce: 4,
    description: "A second person was detected in the room.",
  },
  NO_FACE: {
    label: "Candidate absent",
    severity: "high",
    weight: 8,
    icon: "🚫",
    debounce: 45,
    description: "No face detected — the candidate left the frame.",
  },
  TAB_SWITCH: {
    label: "Left the interview tab",
    severity: "high",
    weight: 10,
    icon: "🗔",
    debounce: 0,
    description: "The candidate switched away from the interview window.",
  },
  BOOK_DETECTED: {
    label: "Book / notes",
    severity: "medium",
    weight: 6,
    icon: "📖",
    debounce: 5,
    description: "A book or notes were detected in the frame.",
  },
  LIP_SYNC_MISMATCH: {
    label: "Lip-sync mismatch",
    severity: "medium",
    weight: 4,
    icon: "🗣️",
    debounce: 55,
    description: "Speech was heard but the candidate's lips were not moving.",
  },
  LOOKING_AWAY: {
    label: "Looking away",
    severity: "medium",
    weight: 3,
    icon: "👀",
    debounce: 90,
    description: "Gaze directed away from the screen for a sustained period.",
  },
  BACKGROUND_VOICE: {
    label: "Background voice",
    severity: "low",
    weight: 3,
    icon: "🔊",
    debounce: 50,
    description: "Sustained speech while the candidate's mouth was closed.",
  },
  FULLSCREEN_EXIT: {
    label: "Exited fullscreen",
    severity: "medium",
    weight: 5,
    icon: "⛶",
    debounce: 0,
    description: "The candidate exited fullscreen mode.",
  },
};

export const SEVERITY_COLOR: Record<string, string> = {
  low: "text-warn",
  medium: "text-warn",
  high: "text-danger",
  critical: "text-danger",
};

export function verdictFor(score: number): "clear" | "minor" | "high-risk" {
  if (score >= 80) return "clear";
  if (score >= 50) return "minor";
  return "high-risk";
}

/**
 * Tracks how long each condition has been continuously active and fires a
 * callback exactly once when it crosses its debounce threshold. Prevents a
 * flickering detection from spamming the event log.
 */
export class Debouncer {
  private counters = new Map<ViolationType, number>();
  private active = new Set<ViolationType>();

  /** Feed the current per-tick condition state. Returns types that just fired. */
  update(states: Partial<Record<ViolationType, boolean>>): ViolationType[] {
    const fired: ViolationType[] = [];
    (Object.keys(VIOLATIONS) as ViolationType[]).forEach((type) => {
      const on = states[type] === true;
      const count = (this.counters.get(type) ?? 0) + (on ? 1 : 0);
      if (on) {
        this.counters.set(type, count);
        if (!this.active.has(type) && count >= VIOLATIONS[type].debounce) {
          this.active.add(type);
          fired.push(type);
        }
      } else {
        this.counters.set(type, 0);
        this.active.delete(type);
      }
    });
    return fired;
  }

  /** Fire a one-shot event immediately (used for tab-switch / fullscreen). */
  isActive(type: ViolationType): boolean {
    return this.active.has(type);
  }

  reset() {
    this.counters.clear();
    this.active.clear();
  }
}
