import { LAST_FRAME, poseAtFrame } from "./motion";
import type { CameraView } from "./motion";
function Figure({
  frame,
  x,
  view,
  accent = "#df925e",
}: {
  frame: number;
  x: number;
  view: CameraView;
  accent?: string;
}) {
  const p = poseAtFrame(frame);
  const bend = p.bend * 95;
  return (
    <g transform={`translate(${x} 185)`}>
      {view === "top" ? (
        <>
          <g transform={`rotate(${(p.skiYaw * 180) / Math.PI} -22 0)`}>
            <rect
              x="-29"
              y="-95"
              width="14"
              height="190"
              rx="7"
              fill="#47766c"
            />
            <rect
              x="-28"
              y="-15"
              width="12"
              height="35"
              rx="4"
              fill="#263e49"
            />
          </g>
          <g transform={`rotate(${(-p.skiYaw * 180) / Math.PI} 22 0)`}>
            <rect
              x="15"
              y="-95"
              width="14"
              height="190"
              rx="7"
              fill="#47766c"
            />
            <rect x="16" y="-15" width="12" height="35" rx="4" fill="#263e49" />
          </g>
          <ellipse cy={-bend} rx="32" ry="21" fill={accent} />
          <circle cy={-32 - bend} r="16" fill="#28474b" />
        </>
      ) : view === "side" ? (
        <>
          <path
            d="M-100 112H100l12-9"
            stroke="#47766c"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M0 103 -20 ${65 - bend * 0.3} 0 ${25 + bend}`}
            stroke="#263e49"
            strokeWidth="17"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M0 ${25 + bend} 10 ${-35 + bend}`}
            stroke={accent}
            strokeWidth="35"
            strokeLinecap="round"
          />
          <path
            d={`M10 ${-25 + bend} 42 ${10 + bend} 54 ${30 + bend}`}
            stroke={accent}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="14" cy={-65 + bend} r="21" fill="#28474b" />
          <path d={`M24 ${-65 + bend}h13`} stroke="#abcfcc" strokeWidth="9" />
        </>
      ) : (
        <>
          <path
            d="M-39 110H-5m10 0h34"
            stroke="#47766c"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={`M-22 102-24 ${60 + bend * 0.4} -17 ${25 + bend} M22 102 24 ${60 + bend * 0.4} 17 ${25 + bend}`}
            stroke="#263e49"
            strokeWidth="17"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M-23 ${-35 + bend}H23L19 ${28 + bend}H-19Z`}
            fill={accent}
          />
          <circle cy={-64 + bend} r="21" fill="#28474b" />
          <rect
            x="-16"
            y={-70 + bend}
            width="32"
            height="9"
            rx="4"
            fill="#abcfcc"
          />
          <path
            d={`M-27 ${-25 + bend} -42 ${17 + bend}M27 ${-25 + bend} 42 ${17 + bend}`}
            stroke={accent}
            strokeWidth="13"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      <circle cy="112" r="5" fill="#b4774c" />
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
}: {
  frame: number;
  view: CameraView;
  trajectory: boolean;
  compare: boolean;
  a: number;
  b: number;
}) {
  return (
    <svg
      viewBox="0 0 680 410"
      className="svg-scene"
      role="img"
      aria-label={`Облегчённая SVG-модель, ${view === "top" ? "вид сверху" : view === "side" ? "вид сбоку" : "вид спереди"}. Поза на кадре ${frame}. Не инструкция катания.`}
    >
      <defs>
        <pattern
          id="lab-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path d="M40 0H0V40" fill="none" stroke="#dce5df" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="680" height="410" fill="#edf2f0" />
      <rect width="680" height="410" fill="url(#lab-grid)" />
      {trajectory && !compare && (
        <path
          d={Array.from({ length: LAST_FRAME + 1 }, (_, i) => {
            const p = poseAtFrame(i);
            return `${i === 0 ? "M" : "L"}${340 + p.rootX * 45} ${297 + p.rootZ * 30}`;
          }).join(" ")}
          fill="none"
          stroke="#bc7d50"
          strokeWidth="2"
          strokeDasharray="5 6"
        />
      )}
      {compare ? (
        <>
          <Figure frame={a} x={210} view={view} />
          <Figure frame={b} x={470} view={view} accent="#6e9b9a" />
        </>
      ) : (
        <g transform={`translate(0 ${poseAtFrame(frame).rootZ * 30})`}>
          <Figure
            frame={frame}
            x={340 + poseAtFrame(frame).rootX * 45}
            view={view}
          />
        </g>
      )}
      <text x="24" y="382" fill="#647870" fontSize="12">
        SVG · условная проекция · не физический симулятор
      </text>
    </svg>
  );
}
