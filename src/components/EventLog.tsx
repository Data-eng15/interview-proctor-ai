import type { ProctorEvent } from "../lib/types";
import { VIOLATIONS, SEVERITY_COLOR } from "../lib/violations";

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function EventLog({ events }: { events: ProctorEvent[] }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Live flags</h3>
        <span className="rounded-full bg-edge px-2 py-0.5 text-[11px] text-slate-300">
          {events.length}
        </span>
      </div>
      <div className="scroll-thin flex-1 space-y-1.5 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="grid h-full min-h-[120px] place-items-center text-center text-xs text-slate-500">
            No flags yet — all clear. ✓
          </div>
        ) : (
          events.map((e) => {
            const meta = VIOLATIONS[e.type];
            return (
              <div
                key={e.id}
                className="animate-fade-up flex items-start gap-2.5 rounded-lg border border-edge bg-panel2/60 px-2.5 py-2"
              >
                <span className="text-base leading-none">{meta.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-[13px] font-semibold ${SEVERITY_COLOR[meta.severity]}`}
                    >
                      {meta.label}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-slate-500">
                      {fmt(e.at)}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-slate-500">
                    {e.detail ?? meta.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
