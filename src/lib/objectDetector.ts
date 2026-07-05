import "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

export type ObjectDetector = cocoSsd.ObjectDetection;
export type Detection = cocoSsd.DetectedObject;

// COCO labels we treat as proctoring signals.
export const WATCHED = new Set([
  "cell phone",
  "book",
  "laptop",
  "tv",
  "remote",
  "person",
]);

// Per-class confidence. Phones matter most and are often only partially visible
// (held at an angle, half-occluded by a hand), so they get a low bar; books/
// people use a higher bar to avoid false positives. A phone is sometimes
// mislabelled "remote", so that is treated leniently too.
const THRESHOLDS: Record<string, number> = {
  "cell phone": 0.3,
  remote: 0.35,
  laptop: 0.5,
  tv: 0.5,
  book: 0.5,
  person: 0.6,
};
const DEFAULT_MIN = 0.6;

export async function createObjectDetector(): Promise<ObjectDetector> {
  // Full mobilenet_v2 (not lite) — meaningfully better at detecting phones held
  // at angles / back-first, which the lite model frequently misses. Object
  // detection runs only ~1.5x/sec so the extra cost is affordable.
  return cocoSsd.load({ base: "mobilenet_v2" });
}

export async function detectObjects(
  detector: ObjectDetector,
  video: HTMLVideoElement
): Promise<Detection[]> {
  const preds = await detector.detect(video, 12);
  return preds
    .filter((p) => WATCHED.has(p.class) && p.score >= (THRESHOLDS[p.class] ?? DEFAULT_MIN))
    // treat a "remote" detection as a phone — COCO often confuses the two
    .map((p) => (p.class === "remote" ? { ...p, class: "cell phone" } : p));
}
