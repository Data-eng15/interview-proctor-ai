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

// Raised from 0.5 to cut low-confidence misdetections (dark rectangles read as
// phones, patterns read as books). Combined with two-cycle confirmation upstream.
const MIN_SCORE = 0.6;

export async function createObjectDetector(): Promise<ObjectDetector> {
  return cocoSsd.load({ base: "lite_mobilenet_v2" });
}

export async function detectObjects(
  detector: ObjectDetector,
  video: HTMLVideoElement
): Promise<Detection[]> {
  const preds = await detector.detect(video, 8);
  return preds.filter((p) => p.score >= MIN_SCORE && WATCHED.has(p.class));
}
