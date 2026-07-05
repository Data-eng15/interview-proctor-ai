import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export async function createFaceLandmarker(): Promise<FaceLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numFaces: 3,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  });
}

/** Read a named blendshape score (0..1) from the first detected face. */
export function blendshape(
  result: FaceLandmarkerResult,
  name: string
): number {
  const cats = result.faceBlendshapes?.[0]?.categories;
  if (!cats) return 0;
  const c = cats.find((x) => x.categoryName === name);
  return c ? c.score : 0;
}

export type Gaze = "center" | "left" | "right" | "up" | "down" | "unknown";

/**
 * Scale-invariant head-orientation features from face-mesh geometry.
 *  - `yaw`   : horizontal nose offset between the cheeks (turning left/right)
 *  - `pitch` : vertical nose position between brow and chin (tilting up/down)
 * Both are ratios normalized by face size, so they're independent of distance.
 * Compared against a per-session baseline to detect looking away / down.
 */
export function headFeatures(
  result: FaceLandmarkerResult
): { yaw: number; pitch: number } | null {
  const lm = result.faceLandmarks?.[0];
  if (!lm) return null;
  const nose = lm[1];
  const right = lm[234];
  const left = lm[454];
  const brow = lm[168];
  const chin = lm[152];
  if (!nose || !right || !left || !brow || !chin) return null;

  const faceW = Math.abs(left.x - right.x) || 1e-6;
  const midX = (left.x + right.x) / 2;
  const yaw = (nose.x - midX) / faceW;

  const faceH = Math.abs(chin.y - brow.y) || 1e-6;
  const pitch = (nose.y - brow.y) / faceH;

  return { yaw, pitch };
}

export { FaceLandmarker };
export type { FaceLandmarkerResult };
