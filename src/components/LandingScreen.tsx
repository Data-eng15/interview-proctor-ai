const FEATURES = [
  { icon: "🙂", title: "Face & identity", body: "Confirms one candidate is present; flags absence or multiple faces (impersonation)." },
  { icon: "👀", title: "Gaze tracking", body: "Estimates head/eye direction to catch sustained looking-away." },
  { icon: "📱", title: "Environment scan", body: "Detects phones, books and extra people in the camera view." },
  { icon: "🗣️", title: "Voice & lip-sync", body: "Listens for speech and checks it against lip movement." },
  { icon: "🗔", title: "Focus monitor", body: "Flags tab switches, window blur and fullscreen exits." },
  { icon: "📊", title: "Integrity report", body: "Live score and a downloadable end-of-session summary." },
];

export default function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="text-center">
        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-edge bg-panel/60 px-3 py-1 text-xs text-brand-soft">
          🔒 100% on-device · no video ever leaves your browser
        </span>
        <h1 className="animate-fade-up mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">
          AI proctoring for{" "}
          <span className="bg-gradient-to-r from-brand-soft to-ok bg-clip-text text-transparent">
            remote interviews
          </span>
        </h1>
        <p className="animate-fade-up mx-auto mt-4 max-w-2xl text-base text-slate-400">
          Real-time face, gaze, object and voice monitoring that runs entirely in
          the browser — verifying the integrity of a remote interview without a
          single byte of video leaving the device.
        </p>
        <div className="animate-fade-up mt-7 flex items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="rounded-xl bg-gradient-to-r from-brand to-brand-soft px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:brightness-110"
          >
            ▶ Start proctoring session
          </button>
          <a
            href="https://github.com/Data-eng15/interview-proctor-ai"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-edge px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-brand hover:text-white"
          >
            View code
          </a>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Grants camera &amp; microphone access. Works best in Chrome / Edge.
        </p>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-edge bg-panel/60 p-5 transition hover:border-brand/50"
          >
            <div className="mb-2 text-2xl">{f.icon}</div>
            <h3 className="mb-1 font-semibold text-white">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-edge bg-panel/50 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-soft">
          Based on published research
        </p>
        <h3 className="mt-2 max-w-3xl font-semibold text-white">
          “AI-Based Proctoring System with Advanced Features for Interview
          Proctoring”
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          M. V. Thorwat, A. M. Yadav, <strong>S. N. Dharne</strong>, R. S. Patil,
          S. S. Laykar · ISTE Journal, Vol. 47, Special Issue No. 1, August 2024.
          This app is a working, in-browser realization of that system.
        </p>
      </div>
    </div>
  );
}
