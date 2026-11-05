import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import {
  BONES,
  sampleMotion,
  projectPoint,
  skiOutline,
  skiPoint,
} from "../lab/rig";
import type { JointId, Vec3 } from "../lab/rig";

export type PreviewState = {
  frame: number;
  view: "side" | "front";
  labels: boolean;
  focus: "body" | "legs" | "boots";
};
const initial: PreviewState = {
  frame: 0,
  view: "side",
  labels: true,
  focus: "legs",
};
const PreviewContext = createContext<{
  state: PreviewState;
  update: (p: Partial<PreviewState>) => void;
}>({ state: initial, update: () => {} });
export function PreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  return (
    <PreviewContext.Provider
      value={{ state, update: (p) => setState((s) => ({ ...s, ...p })) }}
    >
      {children}
    </PreviewContext.Provider>
  );
}
export const usePreview = () => useContext(PreviewContext);
export function BalancePreview() {
  const { state, update } = usePreview();
  const sample = sampleMotion(state.frame, "balance"),
    j = sample.joints;
  const point = (p: Vec3) => {
    const [x, y] = projectPoint(p, state.view);
    return [210 + x * 135, 294 + y * 135];
  };
  const points = (ps: Vec3[]) => ps.map((p) => point(p).join(",")).join(" ");
  const focusJoint: JointId =
    state.focus === "body"
      ? "chest"
      : state.focus === "legs"
        ? "leftKnee"
        : "leftAnkle";
  const marker = point(j[focusJoint]);
  return (
    <section
      className="balance-preview"
      aria-label="Интерактивная схема Balance"
    >
      <div className="preview-top">
        <span>НАБЛЮДЕНИЕ / BALANCE</span>
        <span>SVG · без WebGL</span>
      </div>
      <div
        className="preview-views"
        role="group"
        aria-label="Ракурс мини-схемы"
      >
        {(["side", "front"] as const).map((v) => (
          <button
            key={v}
            aria-pressed={state.view === v}
            onClick={() => update({ view: v })}
          >
            {v === "side" ? "Сбоку" : "Спереди"}
          </button>
        ))}
      </div>
      <svg
        viewBox="0 0 420 340"
        role="img"
        aria-label={`Balance: ${state.view === "side" ? "сбоку" : "спереди"}, кадр ${state.frame}. Условная модель, не эталон техники.`}
        data-testid="balance-preview"
        data-frame={state.frame}
        data-view={state.view}
      >
        <path d="M30 302H390" stroke="#bfd0dd" strokeWidth="1.5" />
        {state.view === "front" && (
          <polygon
            points={points([
              j.leftHip,
              j.leftShoulder,
              j.rightShoulder,
              j.rightHip,
            ])}
            fill={state.focus === "body" ? "#a55b15" : "#bd8550"}
          />
        )}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {Object.values(sample.skis).map((ski, i) => (
            <g key={i}>
              <polygon
                points={points(skiOutline(ski))}
                fill="#143d60"
                stroke="#143d60"
                strokeWidth="3"
              />
              <polyline
                points={points([
                  skiPoint(ski, [0, 0.23, 0.01]),
                  skiPoint(ski, [0, 0.09, 0.01]),
                  skiPoint(ski, [0, 0.09, 0.16]),
                ])}
                stroke={state.focus === "boots" ? "#9a5513" : "#254d69"}
                strokeWidth="13"
              />
            </g>
          ))}
          {BONES.map((bone, i) => {
            const a = point(j[bone.from]),
              b = point(j[bone.to]);
            const active =
              state.focus === "legs"
                ? bone.group === "leg"
                : state.focus === "body"
                  ? ["spine", "shoulder", "pelvis"].includes(bone.group)
                  : false;
            return (
              <line
                key={i}
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke={
                  active
                    ? "#a55b15"
                    : bone.group === "arm"
                      ? "#bd8550"
                      : "#244b66"
                }
                strokeWidth={
                  bone.group === "leg"
                    ? 13
                    : bone.group === "spine" &&
                        bone.to !== "neck" &&
                        bone.to !== "head"
                      ? 24
                      : 8
                }
              />
            );
          })}
        </g>
        <circle
          cx={point(j.head)[0]}
          cy={point(j.head)[1]}
          r="16"
          fill="#153b58"
        />
        <path
          d={`M${point(j.head)[0] - 12} ${point(j.head)[1] + 1}h24`}
          stroke="#b8dcea"
          strokeWidth="5"
        />
        {(
          [
            "pelvis",
            "leftKnee",
            "rightKnee",
            "leftAnkle",
            "rightAnkle",
          ] as JointId[]
        ).map((key) => {
          const p = point(j[key]);
          return (
            <circle
              key={key}
              data-joint={key}
              data-x={j[key][0]}
              data-y={j[key][1]}
              data-z={j[key][2]}
              cx={p[0]}
              cy={p[1]}
              r="3.5"
              fill="#fff"
              stroke="#254d69"
            />
          );
        })}
        <circle
          cx={marker[0]}
          cy={marker[1]}
          r="11"
          fill="none"
          stroke="#a55b15"
          strokeWidth="2"
        />
        {state.labels && (
          <g fill="#163d5c" fontSize="14" fontFamily="sans-serif">
            <path d={`M${marker[0] + 12} ${marker[1]}H322`} stroke="#637f91" />
            <text x="323" y={marker[1] - 7}>
              {state.focus === "body"
                ? "Корпус"
                : state.focus === "legs"
                  ? "Колено"
                  : "Ботинок"}
            </text>
            <text x="30" y="326">
              Две лыжи · одна модель D0.2
            </text>
          </g>
        )}
      </svg>
      <div className="preview-controls">
        <div
          className="preview-frames"
          role="group"
          aria-label="Состояния мини-схемы"
        >
          {[0, 60, 120].map((frame, i) => (
            <button
              key={frame}
              aria-label={`Состояние ${i + 1}, кадр ${frame}`}
              aria-pressed={state.frame === frame}
              onClick={() => update({ frame })}
            >
              {["A", "B", "C"][i]}
              <span>{frame / 30} с</span>
            </button>
          ))}
        </div>
        <label className="preview-labels">
          <input
            type="checkbox"
            checked={state.labels}
            onChange={(e) => update({ labels: e.target.checked })}
          />
          Подписи
        </label>
        <label className="preview-focus">
          Наблюдать
          <select
            value={state.focus}
            onChange={(e) =>
              update({ focus: e.target.value as PreviewState["focus"] })
            }
          >
            <option value="legs">Колени и ноги</option>
            <option value="body">Корпус</option>
            <option value="boots">Ботинки и лыжи</option>
          </select>
        </label>
      </div>
      <p className="preview-description">
        Кадр {state.frame}:{" "}
        {state.frame === 120
          ? "таз модели ниже исходного"
          : state.frame === 60
            ? "промежуточное положение"
            : "исходное положение"}
        . Выделено:{" "}
        {state.focus === "legs"
          ? "ноги и колено"
          : state.focus === "body"
            ? "корпус"
            : "ботинки"}
        . Силы, давление и центр масс не рассчитываются.
      </p>
    </section>
  );
}
