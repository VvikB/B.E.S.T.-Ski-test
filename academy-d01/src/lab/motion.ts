/** Original neutral technical clip. Not a biomechanical model or skiing instruction. */
export const SAMPLE_RATE = 30;
export const DURATION = 8;
export const LAST_FRAME = SAMPLE_RATE * DURATION;
export type CameraView = "orbit" | "top" | "side" | "front";
export type Quality = "auto" | "low" | "high";
export type RenderMode = "3d" | "svg";
export function clampFrame(value: number): number {
  return Math.min(
    LAST_FRAME,
    Math.max(0, Math.round(Number.isFinite(value) ? value : 0)),
  );
}
export function stepFrame(frame: number, delta: number) {
  return clampFrame(frame + delta);
}
export function frameFromSeconds(seconds: number) {
  return clampFrame(seconds * SAMPLE_RATE);
}
export function poseAtFrame(rawFrame: number) {
  const frame = clampFrame(rawFrame);
  const phase = (frame / LAST_FRAME) * Math.PI * 2;
  const wave = (1 - Math.cos(phase)) / 2;
  return {
    frame,
    seconds: frame / SAMPLE_RATE,
    bend: wave * 0.21,
    sway: Math.sin(phase) * 0.06,
    skiYaw: Math.sin(phase) * 0.11,
    rootX: Math.sin(phase) * 0.65,
    rootZ: (1 - Math.cos(phase)) * 0.28,
  };
}
export function resolveQuality(quality: Quality, compact: boolean) {
  return quality === "auto" ? (compact ? "low" : "high") : quality;
}
export function cameraPosition(
  view: CameraView,
  compare = false,
): [number, number, number] {
  const scale = compare ? 1.45 : 1;
  if (view === "top") return [0, 6.5 * scale, 0];
  if (view === "side") return [6 * scale, 1, 0];
  if (view === "front") return [0, 1, 6 * scale];
  return [4 * scale, 3.1 * scale, 5.4 * scale];
}
export const clipManifest = {
  id: "best-neutral-stance",
  version: "0.1.0",
  status: "technical-only",
  author: "B.E.S.T. Academy D0.1 original procedural geometry",
  durationSeconds: DURATION,
  samplesPerSecond: SAMPLE_RATE,
  units: "arbitrary scene units, not a physical measurement",
  axes: "right-handed; Y up, +Z local front",
  rootMarker: "R: rig origin on floor, not centre of mass",
  methodicallyApproved: false,
  assetRights:
    "Original programmatic geometry and clip created for this project; no external models, textures or recorded personal data",
};
