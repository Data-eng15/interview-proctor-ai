import { useState } from "react";
import { useProctor } from "./hooks/useProctor";
import LandingScreen from "./components/LandingScreen";
import InterviewScreen from "./components/InterviewScreen";
import MonitorStage from "./components/MonitorStage";
import StatusPanel from "./components/StatusPanel";
import EventLog from "./components/EventLog";
import IntegrityGauge from "./components/IntegrityGauge";
import ReportModal from "./components/ReportModal";

type Role = "candidate" | "proctor";

export default function App() {
  const p = useProctor();
  const [role, setRole] = useState<Role>("candidate");
  const [showReport, setShowReport] = useState(true);

  const inSession =
    p.status === "requesting" ||
    p.status === "loading" ||
    p.status === "running";
  const ended = p.status === "ended";

  function begin() {
    setRole("candidate");
    setShowReport(true);
    p.start();
  }

  return (
    <div className="min-h-full">
      {/* Hidden engine video: the AI capture source, always mounted so
          detection is independent of which view is on screen. */}
      <video
        ref={p.videoRef}
        autoPlay
        playsInline
        muted
        aria-hidden
        className="pointer-events-none fixed -z-10 h-px w-px opacity-0"
      />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-semibold text-white">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-soft text-sm">
            👁
          </span>
          <span>ProctorAI</span>
        </div>

        {(inSession || ended) && (
          <div className="flex items-center gap-3">
            <RoleToggle role={role} onChange={setRole} />
            {inSession && (
              <button
                onClick={() => {
                  setShowReport(true);
                  p.stop();
                }}
                className="rounded-lg bg-danger/90 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                ■ End
              </button>
            )}
          </div>
        )}
      </header>

      {p.status === "idle" && <LandingScreen onStart={begin} />}

      {p.status === "error" && (
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="mb-3 text-4xl">📷</div>
          <p className="mb-5 text-slate-300">{p.error}</p>
          <button
            onClick={begin}
            className="rounded-xl bg-gradient-to-r from-brand to-brand-soft px-6 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {/* ---------------- Candidate role ---------------- */}
      {role === "candidate" && inSession && (
        <InterviewScreen stream={p.stream} status={p.status} onFinish={p.stop} />
      )}
      {role === "candidate" && ended && (
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <p className="mb-1 text-lg font-semibold text-white">
            Interview submitted
          </p>
          <p className="mb-6 text-sm text-slate-400">
            Thank you. Your responses and proctoring session have been sent to
            your interviewer.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={begin}
              className="rounded-xl border border-edge px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:border-brand"
            >
              Restart
            </button>
            <button
              onClick={() => setRole("proctor")}
              className="rounded-xl bg-gradient-to-r from-brand to-brand-soft px-6 py-2.5 text-sm font-semibold text-white"
            >
              Switch to Proctor view →
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Proctor role ---------------- */}
      {role === "proctor" && (inSession || ended) && (
        <main className="mx-auto max-w-6xl px-5 pb-12">
          <div className="mb-4 rounded-xl border border-edge bg-panel/40 px-4 py-2.5 text-xs text-slate-400">
            🖥 <span className="font-medium text-slate-300">Proctor dashboard</span>{" "}
            — in a real deployment this runs on the interviewer's machine; the
            candidate never sees this screen.
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <MonitorStage
                stream={p.stream}
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
              <div className="min-h-[240px] flex-1 rounded-2xl border border-edge bg-panel/60 p-4">
                <EventLog events={p.events} />
              </div>
              {ended && p.report && !showReport && (
                <button
                  onClick={() => setShowReport(true)}
                  className="rounded-xl border border-edge px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-brand"
                >
                  View session report
                </button>
              )}
            </div>
          </div>
        </main>
      )}

      {role === "proctor" && ended && p.report && showReport && (
        <ReportModal
          report={p.report}
          onRestart={begin}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

function RoleToggle({
  role,
  onChange,
}: {
  role: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <div className="flex rounded-lg border border-edge bg-panel2/60 p-0.5 text-xs font-medium">
      {(["candidate", "proctor"] as Role[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded-md px-3 py-1.5 transition ${
            role === r
              ? "bg-brand text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {r === "candidate" ? "👤 Candidate" : "🖥 Proctor"}
        </button>
      ))}
    </div>
  );
}
