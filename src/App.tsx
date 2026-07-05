import { useState } from "react";
import { useProctor } from "./hooks/useProctor";
import LandingScreen from "./components/LandingScreen";
import VideoStage from "./components/VideoStage";
import StatusPanel from "./components/StatusPanel";
import EventLog from "./components/EventLog";
import IntegrityGauge from "./components/IntegrityGauge";
import ReportModal from "./components/ReportModal";

export default function App() {
  const p = useProctor();
  const [showReport, setShowReport] = useState(true);

  const inSession =
    p.status === "requesting" ||
    p.status === "loading" ||
    p.status === "running";

  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-semibold text-white">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-soft text-sm">
            👁
          </span>
          <span>ProctorAI</span>
        </div>
        {inSession && (
          <button
            onClick={() => {
              setShowReport(true);
              p.stop();
            }}
            className="rounded-lg bg-danger/90 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            ■ End session
          </button>
        )}
      </header>

      {p.status === "idle" && <LandingScreen onStart={p.start} />}

      {p.status === "error" && (
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="mb-3 text-4xl">📷</div>
          <p className="mb-5 text-slate-300">{p.error}</p>
          <button
            onClick={p.start}
            className="rounded-xl bg-gradient-to-r from-brand to-brand-soft px-6 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {inSession && (
        <main className="mx-auto max-w-6xl px-5 pb-12">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <VideoStage
                videoRef={p.videoRef}
                canvasRef={p.canvasRef}
                status={p.status}
                metrics={p.metrics}
                loadingMsg={p.loadingMsg}
              />
              <StatusPanel metrics={p.metrics} />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 rounded-2xl border border-edge bg-panel/60 p-4">
                <IntegrityGauge score={p.score} size={104} />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Live integrity
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Starts at 100 and drops as flags are raised. Serious flags
                    (phone, multiple faces) cost the most.
                  </p>
                </div>
              </div>
              <div className="flex-1 rounded-2xl border border-edge bg-panel/60 p-4">
                <EventLog events={p.events} />
              </div>
            </div>
          </div>
        </main>
      )}

      {p.status === "ended" && !showReport && (
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <p className="mb-1 text-lg font-semibold text-white">Session ended</p>
          <p className="mb-5 text-sm text-slate-400">
            Final integrity score: {p.report?.score ?? p.score}/100
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={p.start}
              className="rounded-xl bg-gradient-to-r from-brand to-brand-soft px-6 py-2.5 text-sm font-semibold text-white"
            >
              New session
            </button>
            {p.report && (
              <button
                onClick={() => setShowReport(true)}
                className="rounded-xl border border-edge px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:border-brand"
              >
                View report
              </button>
            )}
          </div>
        </div>
      )}

      {p.status === "ended" && p.report && showReport && (
        <ReportModal
          report={p.report}
          onRestart={p.start}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
