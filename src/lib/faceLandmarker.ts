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
 * Estimate gaze direction from eye-look blendshapes. Returns the dominant
 * direction if it clearly exceeds a threshold, else "center".
 */
export function estimateGaze(result: FaceLandmarkerResult): Gaze {
  if (!result.faceBlendshapes?.[0]) return "unknown";
  const left = blendshape(result, "eyeLookOutLeft") +
    blendshape(result, "eyeLookInRight");
  const right = blendshape(result, "eyeLookOutRight") +
    blendshape(result, "eyeLookInLeft");
  const up = blendshape(result, "eyeLookUpLeft") +
    blendshape(result, "eyeLookUpRight");
  const down = blendshape(result, "eyeLookDownLeft") +
    blendshape(result, "eyeLookDownRight");

  const entries: [Gaze, number][] = [
    ["left", left],
    ["right", right],
    ["up", up],
    ["down", down],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  const [dir, val] = entries[0];
  // Each direction sums two blendshapes (0..2). Require a strong, deliberate
  // look-away before reporting a direction; natural glances stay "center".
  return val > 1.3 ? dir : "center";
}

export { FaceLandmarker };
export type { FaceLandmarkerResult };
