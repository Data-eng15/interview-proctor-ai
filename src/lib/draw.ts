import {
  DrawingUtils,
  FaceLandmarker,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { Detection } from "./objectDetector";

const OK = "#33e1c0";
const ALERT = "#ff5c72";

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  faces: FaceLandmarkerResult,
  objects: Detection[],
  alert: boolean
) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  const color = alert ? ALERT : OK;
  const utils = new DrawingUtils(ctx);

  for (const landmarks of faces.faceLandmarks ?? []) {
    utils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
      color: `${color}55`,
      lineWidth: 0.6,
    });
    utils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
      color,
      lineWidth: 2,
    });
    utils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, {
      color,
      lineWidth: 1.5,
    });
  }

  // Object-detection boxes (drawn un-mirrored; the wrapper mirrors visually).
  for (const o of objects) {
    const [x, y, w, h] = o.bbox;
    const isPerson = o.class === "person";
    const boxColor = isPerson ? OK : ALERT;
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
    ctx.font = "600 15px Inter, sans-serif";
    const label = `${o.class} ${Math.round(o.score * 100)}%`;
    const tw = ctx.measureText(label).width + 12;
    ctx.fillStyle = boxColor;
    ctx.fillRect(x, Math.max(0, y - 22), tw, 22);
    ctx.fillStyle = "#0a0e17";
    ctx.fillText(label, x + 6, Math.max(14, y - 6));
  }
}
