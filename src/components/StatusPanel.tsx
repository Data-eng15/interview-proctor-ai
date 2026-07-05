import type { LiveMetrics } from "../lib/types";

function Tile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "danger" | "idle";
  hint?: string;
}) {
  const ring =
    tone === "ok"
      ? "border-ok/40"
      : tone === "warn"
        ? "border-warn/50"
        : tone === "danger"
          ? "border-danger/50"
          : "border-edge";
  const dot =
    tone === "ok"
      ? "bg-ok"
      : tone === "warn"
        ? "bg-warn"
        : tone === "danger"
          ? "bg-danger"
          : "bg-slate-500";
  return (
    <div className={`rounded-xl border ${ring} bg-panel2/70 p-3`}>
      <div className="mb-1 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[11px] uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

export default function StatusPanel({ metrics }: { metrics: LiveMetrics }) {
  const faceTone =
    metrics.faceCount === 1 ? "ok" : metrics.faceCount === 0 ? "warn" : "danger";
  const faceVal =
    metrics.faceCount === 1
      ? "Present"
      : metrics.faceCount === 0
        ? "Not visible"
        : `${metrics.faceCount} faces`;

  const gazeTone =
    metrics.gaze === "center"
      ? "ok"
      : metrics.gaze === "unknown"
        ? "idle"
        : "warn";

  const phone = metrics.objects.includes("cell phone");
  const book = metrics.objects.includes("book");
  const objTone = phone ? "danger" : book ? "warn" : "ok";
  const objVal = phone
    ? "Phone detected"
    : book
      ? "Book detected"
      : metrics.personCount >= 2
        ? "Extra person"
        : "Clear";

  const voiceTone = metrics.voiceActive ? "warn" : "ok";

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      <Tile label="Face" value={faceVal} tone={faceTone} />
      <Tile
        label="Gaze"
        value={metrics.gaze === "unknown" ? "—" : cap(metrics.gaze)}
        tone={gazeTone}
      />
      <Tile
        label="Environment"
        value={objVal}
        tone={objTone}
        hint={metrics.personCount ? `${metrics.personCount} person(s)` : undefined}
      />
      <Tile
        label="Voice"
        value={metrics.voiceActive ? "Speaking" : "Quiet"}
        tone={voiceTone}
        hint={`level ${Math.round(metrics.voiceLevel * 100)}%`}
      />
      <Tile
        label="Mouth"
        value={metrics.jawOpen > 0.2 ? "Open" : "Closed"}
        tone="idle"
        hint={`jaw ${Math.round(metrics.jawOpen * 100)}%`}
      />
      <Tile label="Engine" value={`${metrics.fps} fps`} tone="idle" />
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
