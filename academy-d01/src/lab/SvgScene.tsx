import { LAST_FRAME } from "./motion";
import type { CameraView } from "./motion";
import {
  BONES,
  MARKERS,
  add,
  markerPoint,
  projectPoint,
  sampleMotion,
  skiOutline,
  skiPoint,
} from "./rig";
import type { Guides, MarkerId, MotionSample, ScenarioId, Vec3 } from "./rig";
type P2 = [number, number];
export function convexHull(points: P2[]): P2[] {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [],
    upper: P2[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0)
      lower.pop();
    lower.push(p);
  }
  for (const p of sorted.slice().reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0)
      upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
function Figure({
  sample,
  view,
  x,
  scale,
  local,
  guides,
  marker,
  accent = "#d99366",
}: {
  sample: MotionSample;
  view: CameraView;
  x: number;
  scale: number;
  local: boolean;
  guides: Guides;
  marker: MarkerId;
  accent?: string;
}) {
  const originY = view === "top" ? 222 : 385;
  const base: Vec3 = local ? [0, 0, 0] : sample.root;
  const project = (p: Vec3): P2 => {
    const [px, py] = projectPoint(add(base, p), view);
    return [x + px * scale, originY + py * scale];
  };
  const path = (points: Vec3[]) =>
    points.map((p) => project(p).join(",")).join(" ");
  const line = (
    a: Vec3,
    b: Vec3,
    width: number,
    color: string,
    key?: string,
  ) => {
    const p = project(a),
      q = project(b);
    return (
      <line
        key={key}
        x1={p[0]}
        y1={p[1]}
        x2={q[0]}
        y2={q[1]}
        stroke={color}
        strokeWidth={width * scale}
        strokeLinecap="round"
      />
    );
  };
  const j = sample.joints;
  const head = project(j.head);
  const limbBones = BONES.filter((b) => b.group === "leg" || b.group === "arm")
    .slice()
    .sort((a, b) => {
      const axis = view === "side" ? 0 : view === "top" ? 1 : 2;
      return (
        j[a.from][axis] + j[a.to][axis] - (j[b.from][axis] + j[b.to][axis])
      );
    });
  return (
    <g
      data-testid="svg-rig"
      data-frame={sample.frame}
      data-scenario={sample.scenario}
    >
      {(["left", "right"] as const).map((side) => {
        const ski = sample.skis[side];
        const bootCorners: Vec3[] = [];
        for (const px of [-0.072, 0.072])
          for (const py of [0.05, 0.28])
            for (const pz of [-0.08, 0.2])
              bootCorners.push(skiPoint(ski, [px, py, pz]));
        return (
          <g key={side}>
            <polygon
              points={path(skiOutline(ski))}
              fill="#416d70"
              stroke="#294c53"
              strokeWidth="2"
            />
            <polygon
              points={convexHull(bootCorners.map(project))
                .map((p) => p.join(","))
                .join(" ")}
              fill="#314f60"
            />
            {guides.skis && (
              <>
                {line(
                  skiPoint(ski, [0, 0.04, -0.78]),
                  skiPoint(ski, [0, 0.04, 0.82]),
                  0.014,
                  side === "left" ? "#ad5f3a" : "#3764a3",
                )}
                {line(
                  skiPoint(ski, [-0.16, 0.05, 0]),
                  skiPoint(ski, [0.16, 0.05, 0]),
                  0.012,
                  "#675076",
                )}
              </>
            )}
          </g>
        );
      })}
      {limbBones
        .filter((b) => b.group === "leg")
        .map((b, i) =>
          line(
            j[b.from],
            j[b.to],
            i % 2 === 0 ? 0.165 : 0.135,
            "#2c4254",
            b.from + b.to,
          ),
        )}
      {line(j.leftHip, j.rightHip, 0.22, "#2c4254")}
      {line(j.lumbar, j.chest, view === "side" ? 0.274 : 0.43, accent)}
      {line(j.leftShoulder, j.rightShoulder, 0.16, accent)}
      {line(j.chest, j.neck, 0.125, "#d8b99e")}
      {limbBones
        .filter((b) => b.group === "arm")
        .map((b) => line(j[b.from], j[b.to], 0.12, accent, b.from + b.to))}
      {(["leftWrist", "rightWrist"] as const).map((key) => {
        const p = project(j[key]);
        return (
          <circle
            key={key}
            cx={p[0]}
            cy={p[1]}
            r={scale * 0.064}
            fill="#294651"
          />
        );
      })}
      <ellipse
        cx={head[0]}
        cy={head[1]}
        rx={scale * 0.15}
        ry={scale * (view === "top" ? 0.14 : 0.166)}
        fill="#284752"
      />
      {view !== "top" && (
        <rect
          x={head[0] - scale * 0.105}
          y={head[1] - scale * 0.025}
          width={scale * 0.21}
          height={scale * 0.052}
          rx={3}
          fill="#b5d8d3"
        />
      )}
      {guides.joints && (
        <g>
          {BONES.map((b) =>
            line(j[b.from], j[b.to], 0.014, "#fff0b0", b.from + b.to),
          )}
          {Object.entries(j).map(([key, p]) => {
            const q = project(p);
            return (
              <circle
                key={key}
                data-joint={key}
                data-x={p[0]}
                data-y={p[1]}
                data-z={p[2]}
                cx={q[0]}
                cy={q[1]}
                r="3.3"
                fill="#2d4566"
              />
            );
          })}
        </g>
      )}
      {guides.body && (
        <>
          {line(j.pelvis, j.neck, 0.018, "#a74e34")}
          {line(j.leftShoulder, j.rightShoulder, 0.012, "#3c5d8c")}
          {line(j.leftHip, j.rightHip, 0.012, "#3c5d8c")}
        </>
      )}
      {marker !== "root" &&
        (() => {
          const p = project(markerPoint(sample, marker, true));
          return (
            <text x={p[0] + 8} y={p[1] - 8} className="svg-marker-label">
              {MARKERS.find((m) => m.id === marker)!.code}
            </text>
          );
        })()}
      {(() => {
        const p = project(markerPoint(sample, marker, true));
        return (
          <circle
            data-testid="svg-marker"
            cx={p[0]}
            cy={p[1]}
            r="4.5"
            fill="#ab5935"
            stroke="#fff"
            strokeWidth="1.5"
          />
        );
      })()}
    </g>
  );
}
export default function SvgScene({
  frame,
  view,
  trajectory,
  compare,
  a,
  b,
  scenario,
  guides,
  marker,
}: {
  frame: number;
  view: CameraView;
  trajectory: boolean;
  compare: boolean;
  a: number;
  b: number;
  scenario: ScenarioId;
  guides: Guides;
  marker: MarkerId;
}) {
  const scale = compare ? 125 : 164;
  const originY = view === "top" ? 222 : 385;
  const trace = Array.from({ length: LAST_FRAME + 1 }, (_, i) => {
    const p = projectPoint(
      markerPoint(sampleMotion(i, scenario), marker),
      view,
    );
    return `${i ? "L" : "M"}${400 + p[0] * scale} ${originY + p[1] * scale}`;
  }).join(" ");
  return (
    <svg
      viewBox="0 0 800 460"
      className="svg-scene"
      role="img"
      aria-label={`Общая с 3D модель суставов. ${view === "top" ? "Вид сверху" : view === "side" ? "Вид сбоку" : "Вид спереди"}. Сценарий ${scenario}, кадр ${frame}. Не инструкция катания.`}
    >
      <defs>
        <pattern
          id="lab-grid"
          width="35"
          height="35"
          patternUnits="userSpaceOnUse"
        >
          <path d="M35 0H0V35" fill="none" stroke="#dce5df" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="800" height="460" fill="#edf2f0" />
      <rect width="800" height="460" fill="url(#lab-grid)" />
      {trajectory && !compare && (
        <path
          data-testid="svg-trace"
          d={trace}
          fill="none"
          stroke="#ab6847"
          strokeWidth="1.7"
          strokeDasharray="5 4"
        />
      )}
      {compare ? (
        <>
          <Figure
            sample={sampleMotion(a, scenario)}
            view={view}
            x={210}
            scale={scale}
            local
            guides={guides}
            marker={marker}
          />
          <Figure
            sample={sampleMotion(b, scenario)}
            view={view}
            x={590}
            scale={scale}
            local
            guides={guides}
            marker={marker}
            accent="#6d9e9f"
          />
        </>
      ) : (
        <Figure
          sample={sampleMotion(frame, scenario)}
          view={view}
          x={400}
          scale={scale}
          local={false}
          guides={guides}
          marker={marker}
        />
      )}
      <text x="22" y="438" fill="#4c6557" fontSize="11">
        SVG · те же суставы и время, упрощённые поверхности
      </text>
    </svg>
  );
}
