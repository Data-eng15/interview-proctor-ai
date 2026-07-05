import type { RefObject } from "react";
import type { LiveMetrics, ProctorStatus } from "../lib/types";

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  status: ProctorStatus;
  metrics: LiveMetrics;
  loadingMsg: string;
}

export default function VideoStage({
  videoRef,
  canvasRef,
  status,
  metrics,
  loadingMsg,
}: Props) {
  const alert =
    status === "running" &&
    (metrics.faceCount !== 1 ||
      metrics.objects.includes("cell phone") ||
      metrics.personCount >= 2);

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-black ${
        alert ? "border-danger/70" : "border-edge"
      }`}
    >
      {/* mirrored wrapper so video + overlay align in selfie view */}
      <div className="absolute inset-0 [transform:scaleX(-1)]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* REC badge */}
      {status === "running" && (
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-danger" />
          <span className="text-[11px] font-semibold tracking-wide text-white">
            MONITORING
          </span>
        </div>
      )}

      {alert && (
        <div className="absolute right-3 top-3 rounded-full bg-danger/90 px-2.5 py-1 text-[11px] font-semibold text-white">
          ⚠ Attention
        </div>
      )}

      {(status === "loading" || status === "requesting") && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="max-w-xs text-sm text-slate-300">
              {status === "requesting"
                ? "Requesting camera & microphone…"
                : loadingMsg}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
