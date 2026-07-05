import { useEffect, useState } from "react";
import type { ProctorStatus } from "../lib/types";
import StreamVideo from "./StreamVideo";

const QUESTIONS = [
  "Tell us about yourself and why you're interested in this role.",
  "Describe a challenging project you worked on. What was your specific contribution?",
  "How do you approach debugging a problem you've never seen before?",
  "Tell us about a time you disagreed with a teammate. How did you resolve it?",
  "Where do you see the biggest opportunity to grow in the next year?",
];

function useElapsed(active: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return s;
}

export default function InterviewScreen({
  stream,
  status,
  onFinish,
}: {
  stream: MediaStream | null;
  status: ProctorStatus;
  onFinish: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const running = status === "running";
  const elapsed = useElapsed(running);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const last = idx === QUESTIONS.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16">
      {/* status bar */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-edge bg-panel/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-danger" />
          <span className="font-medium text-white">
            {running ? "Interview in progress" : "Preparing interview…"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-slate-300">
            {mm}:{ss}
          </span>
          <span className="hidden items-center gap-1.5 rounded-full bg-ok/10 px-2.5 py-1 text-[11px] font-medium text-ok sm:flex">
            🔒 Proctored
          </span>
        </div>
      </div>

      <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
        Question {idx + 1} of {QUESTIONS.length}
      </p>
      <h1 className="mb-6 text-2xl font-semibold leading-snug text-white">
        {QUESTIONS[idx]}
      </h1>

      <textarea
        key={idx}
        placeholder="Type notes for your answer (optional) — or just answer aloud."
        className="h-40 w-full resize-none rounded-xl border border-edge bg-panel2/60 p-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-brand"
      />

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="rounded-xl border border-edge px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-brand disabled:opacity-40"
        >
          ← Previous
        </button>
        {last ? (
          <button
            onClick={onFinish}
            className="rounded-xl bg-gradient-to-r from-brand to-brand-soft px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Finish &amp; submit
          </button>
        ) : (
          <button
            onClick={() => setIdx((i) => Math.min(QUESTIONS.length - 1, i + 1))}
            className="rounded-xl bg-gradient-to-r from-brand to-brand-soft px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Next question →
          </button>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        This session is being monitored for integrity. Results are shared with
        your interviewer — you won't see a score.
      </p>

      {/* self-view thumbnail (what the candidate sees of themselves) */}
      <div className="fixed bottom-5 right-5 w-44 overflow-hidden rounded-xl border border-edge bg-black shadow-xl">
        <StreamVideo
          stream={stream}
          mirror
          className="h-32 w-full object-cover"
        />
        <div className="flex items-center gap-1.5 bg-black/70 px-2 py-1">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-danger" />
          <span className="text-[10px] font-medium tracking-wide text-white">
            You · proctored
          </span>
        </div>
      </div>
    </div>
  );
}
