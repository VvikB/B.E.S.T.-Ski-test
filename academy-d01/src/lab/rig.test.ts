import { describe, expect, it } from "vitest";
import {
  BONES,
  LENGTHS,
  MARKERS,
  SCENARIOS,
  add,
  compareStates,
  distance,
  markerPoint,
  projectPoint,
  sampleMotion,
  skiOutline,
  skiPoint,
  solveTwoBone,
} from "./rig";
import { LAST_FRAME } from "./motion";
import { convexHull } from "./SvgScene";

describe("shared D0.2 articulated geometry", () => {
  it("preserves segment lengths and valid targets across every sample of every clip", () => {
    for (const clip of SCENARIOS)
      for (let f = 0; f <= LAST_FRAME; f++) {
        const j = sampleMotion(f, clip.id).joints;
        for (const side of ["left", "right"] as const) {
          expect(distance(j[`${side}Hip`], j[`${side}Knee`])).toBeCloseTo(
            LENGTHS.thigh,
            9,
          );
          expect(distance(j[`${side}Knee`], j[`${side}Ankle`])).toBeCloseTo(
            LENGTHS.shin,
            9,
          );
          expect(distance(j[`${side}Shoulder`], j[`${side}Elbow`])).toBeCloseTo(
            LENGTHS.upperArm,
            9,
          );
          expect(distance(j[`${side}Elbow`], j[`${side}Wrist`])).toBeCloseTo(
            LENGTHS.forearm,
            9,
          );
        }
        expect(distance(j.pelvis, j.chest)).toBeCloseTo(LENGTHS.spine, 9);
        expect(Object.values(j).flat().every(Number.isFinite)).toBe(true);
      }
  });
  it("keeps ankles attached to their independently oriented boots exactly", () => {
    for (const clip of SCENARIOS)
      for (let f = 0; f <= LAST_FRAME; f++) {
        const s = sampleMotion(f, clip.id);
        expect(s.joints.leftAnkle).toEqual(
          skiPoint(s.skis.left, [0, 0.235, 0.01]),
        );
        expect(s.joints.rightAnkle).toEqual(
          skiPoint(s.skis.right, [0, 0.235, 0.01]),
        );
      }
  });
  it("never silently stretches an unreachable two-bone target", () => {
    expect(() =>
      solveTwoBone([0, 0, 0], [0, 3, 0], 0.44, 0.43, [0, 0, 1]),
    ).toThrow("Unreachable");
  });
  it("has separated paired limb centres and above-plane boot/board vertices throughout all samples", () => {
    for (const clip of SCENARIOS)
      for (let f = 0; f <= LAST_FRAME; f++) {
        const s = sampleMotion(f, clip.id),
          j = s.joints;
        expect(distance(j.leftKnee, j.rightKnee)).toBeGreaterThan(0.176);
        expect(distance(j.leftAnkle, j.rightAnkle)).toBeGreaterThan(0.13);
        expect(j.leftElbow[0]).toBeLessThan(j.leftShoulder[0] - 0.025);
        expect(j.rightElbow[0]).toBeGreaterThan(j.rightShoulder[0] + 0.025);
        for (const side of ["left", "right"] as const)
          expect(
            Math.min(...skiOutline(s.skis[side]).map((p) => p[1])),
          ).toBeGreaterThan(-0.001);
      }
  });
  it("makes deterministic keyframes and closes clip endpoints without new poses on replay", () => {
    for (const c of SCENARIOS) {
      expect(sampleMotion(120, c.id)).toEqual(sampleMotion(120, c.id));
      const a = sampleMotion(0, c.id),
        b = sampleMotion(240, c.id);
      for (const key of Object.keys(a.joints) as (keyof typeof a.joints)[])
        expect(distance(a.joints[key], b.joints[key])).toBeLessThan(1e-9);
    }
  });
  it("does not introduce large per-frame jumps across all five clips", () => {
    for (const c of SCENARIOS)
      for (let f = 1; f <= LAST_FRAME; f++) {
        const prev = sampleMotion(f - 1, c.id),
          next = sampleMotion(f, c.id);
        for (const key of Object.keys(
          prev.joints,
        ) as (keyof typeof prev.joints)[])
          expect(distance(prev.joints[key], next.joints[key])).toBeLessThan(
            0.025,
          );
      }
  });
  it("separates Balance, Edge and Steering degrees of freedom instead of relabeling one motion", () => {
    const b = sampleMotion(60, "balance"),
      e = sampleMotion(60, "edge"),
      s = sampleMotion(60, "steering");
    expect(b.parameters.leftRoll).toBe(0);
    expect(b.parameters.leftYaw).toBe(0);
    expect(e.parameters.leftRoll).toBeCloseTo(0.14);
    expect(e.parameters.leftYaw).toBe(0);
    expect(s.parameters.leftYaw).toBeCloseTo(0.22);
    expect(s.parameters.leftRoll).toBe(0);
  });
  it("Trust uses an illustrative hand gesture with a real hold and no confidence score", () => {
    const a = sampleMotion(90, "trust"),
      b = sampleMotion(120, "trust"),
      end = sampleMotion(240, "trust");
    expect(a.joints.rightWrist).toEqual(b.joints.rightWrist);
    expect(a.joints.rightWrist[1]).toBeGreaterThan(
      end.joints.rightWrist[1] + 0.4,
    );
    expect(a.parameters.leftYaw).toBe(0);
    expect(a.parameters.leftRoll).toBe(0);
    expect(a).not.toHaveProperty("confidence");
  });
  it("derives every selected trajectory point from the same world joint in 3D/SVG", () => {
    for (const m of MARKERS)
      for (const c of SCENARIOS)
        for (const f of [0, 60, 120, 180, 240]) {
          const s = sampleMotion(f, c.id);
          expect(markerPoint(s, m.id)).toEqual(
            add(s.root, markerPoint(s, m.id, true)),
          );
          for (const view of ["front", "side", "top"] as const)
            expect(
              projectPoint(markerPoint(s, m.id), view).every(Number.isFinite),
            ).toBe(true);
        }
  });
  it("uses exact orthographic axes, preserving signed left/right and ignoring only hidden depth", () => {
    expect(projectPoint([1, 2, 3], "front")).toEqual([1, -2]);
    expect(projectPoint([1, 2, 3], "side")).toEqual([-3, -2]);
    expect(projectPoint([1, 2, 3], "top")).toEqual([1, 3]);
  });
  it("keeps the R marker at the model origin, never relabels it as centre of mass", () => {
    const s = sampleMotion(60, "steering");
    expect(markerPoint(s, "root")).toEqual(add(s.root, [0, 0.008, 0]));
    expect(MARKERS[0].label).toContain("не центр масс");
  });
  it("A/B deltas reverse sign and vanish at identical frames without grading the user", () => {
    for (const c of SCENARIOS) {
      const forward = compareStates(0, 60, c.id),
        reverse = compareStates(60, 0, c.id);
      forward.forEach((v, i) =>
        expect(v.value).toBeCloseTo(-reverse[i].value, 9),
      );
      expect(compareStates(90, 90, c.id).every((v) => v.value === 0)).toBe(
        true,
      );
    }
  });
  it("has explicit semantic limits for every scenario and retains the neutral D0.1 clip", () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual([
      "balance",
      "edge",
      "steering",
      "trust",
      "neutral",
    ]);
    expect(
      SCENARIOS.every(
        (s) => s.goal && s.observe && s.limitation && s.phases.length === 5,
      ),
    ).toBe(true);
    expect(BONES.length).toBeGreaterThan(12);
  });
  it("builds a noncrossing projected boot hull rather than drawing all box corners in an arbitrary order", () => {
    const hull = convexHull([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0.5, 0.5],
      [0, 0],
    ]);
    expect(hull.length).toBe(4);
  });
});
