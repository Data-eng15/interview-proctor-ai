import type { SessionReport, ViolationType } from "../lib/types";
import { VIOLATIONS } from "../lib/violations";
import IntegrityGauge from "./IntegrityGauge";

const VERDICT = {
  clear: { label: "Clear", color: "text-ok", blurb: "No significant integrity concerns detected." },
  minor: { label: "Minor concerns", color: "text-warn", blurb: "Some flags were raised — review recommended." },
  "high-risk": { label: "High risk", color: "text-danger", blurb: "Multiple serious flags — manual review required." },
} as const;

function fmtDuration(ms: number) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export default function ReportModal({
  report,
  onRestart,
  onClose,
}: {
  report: SessionReport;
  onRestart: () => void;
  onClose: () => void;
}) {
  const v = VERDICT[report.verdict];
  const flagged = (Object.keys(report.counts) as ViolationType[])
    .filter((t) => report.counts[t] > 0)
    .sort((a, b) => report.counts[b] - report.counts[a]);

  function download() {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctor-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-fade-up w-full max-w-lg rounded-2xl border border-edge bg-panel p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-5">
          <IntegrityGauge score={report.score} size={116} />
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Session verdict
            </p>
            <h2 className={`text-2xl font-bold ${v.color}`}>{v.label}</h2>
            <p className="mt-1 max-w-[220px] text-sm text-slate-400">{v.blurb}</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 text-center">
          <Stat label="Duration" value={fmtDuration(report.durationMs)} />
          <Stat label="Total flags" value={String(report.events.length)} />
          <Stat label="Score" value={`${report.score}/100`} />
        </div>

        <div className="mb-5">
          <p className="mb-2 text-sm font-semibold text-white">Flag breakdown</p>
          {flagged.length === 0 ? (
            <p className="rounded-lg border border-ok/30 bg-ok/5 px-3 py-2 text-sm text-ok">
              ✓ No flags recorded during this session.
            </p>
          ) : (
            <div className="space-y-1.5">
              {flagged.map((t) => (
                <div
                  key={t}
                  className="flex items-center justify-between rounded-lg border border-edge bg-panel2/60 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-200">
                    <span>{VIOLATIONS[t].icon}</span>
                    {VIOLATIONS[t].label}
                  </span>
                  <span className="rounded-full bg-edge px-2 py-0.5 text-xs font-semibold text-white">
                    ×{report.counts[t]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRestart}
            className="flex-1 rounded-xl bg-gradient-to-r from-brand to-brand-soft px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            New session
          </button>
          <button
            onClick={download}
            className="rounded-xl border border-edge px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-brand"
          >
            ⬇ Download report
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-edge px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:border-brand"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-edge bg-panel2/60 py-2.5">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
    </div>
  );
}
