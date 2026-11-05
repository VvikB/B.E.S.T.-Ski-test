import { describe, expect, it } from "vitest";
import {
  cameraPosition,
  clampFrame,
  clipManifest,
  frameFromSeconds,
  LAST_FRAME,
  poseAtFrame,
  resolveQuality,
  stepFrame,
} from "./motion";
describe("neutral clip and timeline invariants", () => {
  it("clamps invalid and boundary frame inputs", () => {
    expect(clampFrame(-1)).toBe(0);
    expect(clampFrame(999)).toBe(LAST_FRAME);
    expect(clampFrame(NaN)).toBe(0);
    expect(clampFrame(1.7)).toBe(2);
  });
  it("single frame steps remain within both clip boundaries", () => {
    expect(stepFrame(0, -1)).toBe(0);
    expect(stepFrame(240, 1)).toBe(240);
    expect(stepFrame(60, 1)).toBe(61);
    expect(stepFrame(61, -1)).toBe(60);
  });
  it("restores the same pose after a frame roundtrip", () => {
    const before = poseAtFrame(127);
    expect(poseAtFrame(stepFrame(stepFrame(127, 1), -1))).toEqual(before);
    expect(frameFromSeconds(before.seconds)).toBe(127);
  });
  it("technical loop has continuous endpoints", () => {
    const start = poseAtFrame(0),
      end = poseAtFrame(LAST_FRAME);
    for (const k of ["bend", "sway", "skiYaw", "rootX", "rootZ"] as const)
      expect(end[k]).toBeCloseTo(start[k], 8);
  });
  it("entire clip has finite bounded technical transforms", () => {
    for (let frame = 0; frame <= LAST_FRAME; frame++) {
      const p = poseAtFrame(frame);
      expect(Object.values(p).every(Number.isFinite)).toBe(true);
      expect(Math.abs(p.skiYaw)).toBeLessThanOrEqual(0.110001);
      expect(p.bend).toBeGreaterThanOrEqual(0);
      expect(p.bend).toBeLessThanOrEqual(0.210001);
    }
  });
  it("applies compact quality without overriding explicit user choice", () => {
    expect(resolveQuality("auto", true)).toBe("low");
    expect(resolveQuality("auto", false)).toBe("high");
    expect(resolveQuality("high", true)).toBe("high");
    expect(resolveQuality("low", false)).toBe("low");
  });
  it("defines distinct reproducible camera presets", () => {
    const positions = ["orbit", "top", "side", "front"].map((v) =>
      cameraPosition(v as "orbit" | "top" | "side" | "front"),
    );
    expect(new Set(positions.map(String)).size).toBe(4);
    expect(cameraPosition("top")[1]).toBeGreaterThan(6);
  });
  it("never claims methodological approval or measured centre of mass", () => {
    expect(clipManifest.methodicallyApproved).toBe(false);
    expect(clipManifest.status).toBe("technical-only");
    expect(clipManifest.rootMarker).toContain("not centre of mass");
  });
});
