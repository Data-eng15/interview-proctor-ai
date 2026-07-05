import { useEffect, useRef } from "react";

/**
 * Renders a <video> bound to a shared MediaStream. Multiple StreamVideo
 * instances can display the same stream simultaneously (candidate self-view +
 * proctor monitor), independent of the hidden engine <video> used for AI.
 */
export default function StreamVideo({
  stream,
  className,
  mirror = false,
}: {
  stream: MediaStream | null;
  className?: string;
  mirror?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (v.srcObject !== stream) {
      v.srcObject = stream;
      if (stream) v.play().catch(() => {});
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className={className}
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    />
  );
}
