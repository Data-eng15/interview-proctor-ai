import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import {
  createFaceLandmarker,
  blendshape,
  headFeatures,
  type Gaze,
} from "../lib/faceLandmarker";
import {
  createObjectDetector,
  detectObjects,
  type Detection,
  type ObjectDetector,
} from "../lib/objectDetector";
import { VoiceMeter, VOICE_THRESHOLD } from "../lib/audio";
import { drawOverlay } from "../lib/draw";
import { Debouncer, VIOLATIONS, verdictFor } from "../lib/violations";
import type {
  LiveMetrics,
  ProctorEvent,
  ProctorStatus,
  SessionReport,
  ViolationType,
} from "../lib/types";

const EMPTY_METRICS: LiveMetrics = {
  faceCount: 0,
  jawOpen: 0,
  gaze: "unknown",
  voiceLevel: 0,
  voiceActive: false,
  objects: [],
  personCount: 0,
  fps: 0,
  calibrating: false,
};

// Head-pose baseline calibration + off-screen thresholds.
const CALIB_MS = 2000; // capture neutral pose over the first 2s
const YAW_TH = 0.13; // horizontal deviation from baseline to count as "away"
const PITCH_TH = 0.1; // vertical deviation from baseline to count as up/down

function emptyCounts(): Record<ViolationType, number> {
  const c = {} as Record<ViolationType, number>;
  (Object.keys(VIOLATIONS) as ViolationType[]).forEach((k) => (c[k] = 0));
  return c;
}

export function useProctor() {
  const [status, setStatus] = useState<ProctorStatus>("idle");
  const [metrics, setMetrics] = useState<LiveMetrics>(EMPTY_METRICS);
  const [events, setEvents] = useState<ProctorEvent[]>([]);
  const [score, setScore] = useState(100);
  const [report, setReport] = useState<SessionReport | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const detectorRef = useRef<ObjectDetector | null>(null);
  const voiceRef = useRef<VoiceMeter | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const rafRef = useRef<number>(0);
  const objTimerRef = useRef<number>(0);
  const audioTimerRef = useRef<number>(0);
  const flushTimerRef = useRef<number>(0);

  const metricsRef = useRef<LiveMetrics>(EMPTY_METRICS);
  const objectsRef = useRef<Detection[]>([]);
  // rolling-window confirmation: an object must appear in >=2 of the last 4
  // scans to flag — robust to single-frame blips, sensitive to intermittent
  // detections (e.g. a phone held at an angle that flickers in and out).
  const classHistory = useRef<Set<string>[]>([]);
  const personHistory = useRef<number[]>([]);
  const objSignals = useRef({ phone: false, book: false, extraPerson: false });
  const baseline = useRef({
    yaw: 0,
    pitch: 0,
    yawSum: 0,
    pitchSum: 0,
    n: 0,
    ready: false,
  });
  const jawWindow = useRef<number[]>([]);
  const voiceWindow = useRef<boolean[]>([]);
  const debouncer = useRef(new Debouncer());
  const scoreRef = useRef(100);
  const eventsRef = useRef<ProctorEvent[]>([]);
  const startTime = useRef(0);
  const cooldown = useRef<Map<ViolationType, number>>(new Map());
  const frameStamps = useRef<number[]>([]);
  const objBusy = useRef(false);

  const logEvent = useCallback((type: ViolationType, detail?: string) => {
    const now = performance.now();
    const last = cooldown.current.get(type) ?? 0;
    if (now - last < 4000) return; // don't drain the score on a recurring flag
    cooldown.current.set(type, now);

    const ev: ProctorEvent = {
      id: crypto.randomUUID(),
      type,
      at: now - startTime.current,
      wallClock: new Date().toLocaleTimeString(),
      detail,
    };
    eventsRef.current = [ev, ...eventsRef.current].slice(0, 200);
    setEvents(eventsRef.current);

    const next = Math.max(0, scoreRef.current - VIOLATIONS[type].weight);
    scoreRef.current = next;
    setScore(next);
  }, []);

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const now = performance.now();
    const result = landmarker.detectForVideo(video, now);
    const faceCount = result.faceLandmarks?.length ?? 0;
    const jawOpen = blendshape(result, "jawOpen");

    // --- head-pose attention (self-calibrating) ---
    const elapsed = now - startTime.current;
    const hf = faceCount === 1 ? headFeatures(result) : null;
    const base = baseline.current;
    let gaze: Gaze = "unknown";
    let offScreen = false;
    const calibrating = hf != null && elapsed < CALIB_MS;

    if (hf) {
      if (elapsed < CALIB_MS) {
        base.yawSum += hf.yaw;
        base.pitchSum += hf.pitch;
        base.n += 1;
      } else {
        if (!base.ready) {
          if (base.n > 0) {
            base.yaw = base.yawSum / base.n;
            base.pitch = base.pitchSum / base.n;
          } else {
            base.yaw = hf.yaw;
            base.pitch = hf.pitch;
          }
          base.ready = true;
        }
        const dYaw = hf.yaw - base.yaw;
        const dPitch = hf.pitch - base.pitch;
        if (Math.abs(dPitch) > PITCH_TH && Math.abs(dPitch) >= Math.abs(dYaw)) {
          gaze = dPitch > 0 ? "down" : "up";
        } else if (Math.abs(dYaw) > YAW_TH) {
          gaze = dYaw > 0 ? "right" : "left";
        } else {
          gaze = "center";
        }
        offScreen = gaze !== "center";
      }
    }

    // rolling windows for lip-sync analysis
    const jw = jawWindow.current;
    jw.push(jawOpen);
    if (jw.length > 24) jw.shift();
    // lenient movement detection → speaking is readily counted as "moving",
    // which minimises false lip-sync-mismatch flags
    const mouthMoving =
      Math.max(...jw) - Math.min(...jw) > 0.04 || Math.max(...jw) > 0.18;

    const vw = voiceWindow.current;
    const voiceSustained =
      vw.length >= 8 && vw.filter(Boolean).length / vw.length > 0.6;

    // fps
    const fs = frameStamps.current;
    fs.push(now);
    while (fs.length && now - fs[0] > 1000) fs.shift();

    const objects = objectsRef.current;
    const personCount = objects.filter((o) => o.class === "person").length;
    const sig = objSignals.current; // two-cycle-confirmed object signals

    // draw overlay (visual alert reserved for serious, stable conditions)
    const ctx = canvas.getContext("2d");
    const anyAlert = faceCount !== 1 || sig.phone || sig.extraPerson;
    if (ctx) drawOverlay(ctx, result, objects, anyAlert);

    // evaluate per-tick violation conditions
    const fired = debouncer.current.update({
      NO_FACE: faceCount === 0,
      MULTIPLE_FACES: faceCount >= 2,
      LOOKING_AWAY: faceCount === 1 && offScreen,
      LIP_SYNC_MISMATCH: faceCount === 1 && voiceSustained && !mouthMoving,
      BACKGROUND_VOICE: faceCount === 0 && voiceSustained,
      PHONE_DETECTED: sig.phone,
      BOOK_DETECTED: sig.book,
      EXTRA_PERSON: sig.extraPerson,
    });
    fired.forEach((t) => logEvent(t));

    metricsRef.current = {
      faceCount,
      jawOpen,
      gaze,
      voiceLevel: metricsRef.current.voiceLevel,
      voiceActive: voiceSustained,
      objects: objects.map((o) => o.class),
      personCount,
      fps: fs.length,
      calibrating,
    };

    rafRef.current = requestAnimationFrame(detectLoop);
  }, [logEvent]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearInterval(objTimerRef.current);
    window.clearInterval(audioTimerRef.current);
    window.clearInterval(flushTimerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    voiceRef.current?.close();
    try {
      landmarkerRef.current?.close();
      detectorRef.current?.dispose();
    } catch {
      /* noop */
    }
    landmarkerRef.current = null;
    detectorRef.current = null;

    setStatus((prev) => {
      if (prev !== "running") return prev;
      const durationMs = performance.now() - startTime.current;
      const counts = emptyCounts();
      eventsRef.current.forEach((e) => (counts[e.type] += 1));
      setReport({
        durationMs,
        startedAt: new Date(Date.now() - durationMs).toLocaleTimeString(),
        endedAt: new Date().toLocaleTimeString(),
        score: scoreRef.current,
        verdict: verdictFor(scoreRef.current),
        events: eventsRef.current,
        counts,
      });
      return "ended";
    });
  }, []);

  const start = useCallback(async () => {
    setError("");
    setReport(null);
    setEvents([]);
    eventsRef.current = [];
    scoreRef.current = 100;
    setScore(100);
    debouncer.current.reset();
    jawWindow.current = [];
    voiceWindow.current = [];
    cooldown.current.clear();
    objectsRef.current = [];
    classHistory.current = [];
    personHistory.current = [];
    objSignals.current = { phone: false, book: false, extraPerson: false };
    baseline.current = { yaw: 0, pitch: 0, yawSum: 0, pitchSum: 0, n: 0, ready: false };
    metricsRef.current = EMPTY_METRICS;

    try {
      setStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;

      setStatus("loading");
      setLoadingMsg("Loading face-mesh and object-detection models…");
      const [landmarker, detector] = await Promise.all([
        createFaceLandmarker(),
        createObjectDetector(),
      ]);
      landmarkerRef.current = landmarker;
      detectorRef.current = detector;
      voiceRef.current = new VoiceMeter(stream);
      await voiceRef.current.resume();

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      await new Promise<void>((res) => {
        if (video.readyState >= 2) return res();
        video.onloadeddata = () => res();
      });

      const canvas = canvasRef.current!;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      startTime.current = performance.now();
      setStatus("running");

      // object detection ~1.1s cadence (heavier model)
      objTimerRef.current = window.setInterval(async () => {
        const d = detectorRef.current;
        const v = videoRef.current;
        if (!d || !v || objBusy.current) return;
        objBusy.current = true;
        try {
          const dets = await detectObjects(d, v);
          objectsRef.current = dets;

          // push into rolling 4-scan history, then confirm on >=2 hits
          const curr = new Set(dets.map((o) => o.class));
          const personNow = dets.filter((o) => o.class === "person").length;
          const ch = classHistory.current;
          ch.push(curr);
          if (ch.length > 4) ch.shift();
          const ph = personHistory.current;
          ph.push(personNow);
          if (ph.length > 4) ph.shift();
          const seen = (cls: string) => ch.filter((s) => s.has(cls)).length;
          objSignals.current = {
            phone: seen("cell phone") >= 2,
            book: seen("book") >= 2,
            extraPerson: ph.filter((c) => c >= 2).length >= 2,
          };
        } catch {
          /* skip frame */
        } finally {
          objBusy.current = false;
        }
      }, 650);

      // audio meter ~180ms
      audioTimerRef.current = window.setInterval(() => {
        const lvl = voiceRef.current?.level() ?? 0;
        const active = lvl > VOICE_THRESHOLD;
        const vw = voiceWindow.current;
        vw.push(active);
        if (vw.length > 12) vw.shift();
        metricsRef.current.voiceLevel = lvl;
      }, 180);

      // flush live metrics to React ~7/sec (keeps re-renders cheap)
      flushTimerRef.current = window.setInterval(() => {
        setMetrics({ ...metricsRef.current });
      }, 150);

      rafRef.current = requestAnimationFrame(detectLoop);
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Camera & microphone access was denied. Please allow access and try again."
          : "Couldn't start the session. Ensure a camera and mic are available.";
      setError(msg);
      setStatus("error");
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
  }, [detectLoop]);

  // window-focus / visibility / fullscreen listeners while running
  useEffect(() => {
    if (status !== "running") return;
    const onVis = () => {
      if (document.hidden) logEvent("TAB_SWITCH", "Switched tab / minimized");
    };
    const onBlur = () => logEvent("TAB_SWITCH", "Window lost focus");
    const onFs = () => {
      if (!document.fullscreenElement) logEvent("FULLSCREEN_EXIT");
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [status, logEvent]);

  // cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return {
    status,
    metrics,
    events,
    score,
    report,
    loadingMsg,
    error,
    videoRef,
    canvasRef,
    start,
    stop,
  };
}
