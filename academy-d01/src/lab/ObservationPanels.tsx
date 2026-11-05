import { ArrowUpRight, Eye, Layers3 } from "lucide-react";
import {
  MARKERS,
  SCENARIOS,
  compareStates,
  markerPoint,
  phaseLabel,
  sampleMotion,
} from "./rig";
import type { Guides, MarkerId, ScenarioId } from "./rig";
export function ScenarioPanel({
  scenario,
  frame,
  onScenario,
  onSeek,
  onRecommended,
}: {
  scenario: ScenarioId;
  frame: number;
  onScenario: (id: ScenarioId) => void;
  onSeek: (frame: number) => void;
  onRecommended: () => void;
}) {
  const clip = SCENARIOS.find((s) => s.id === scenario)!;
  return (
    <section className="scenario-panel" aria-label="Сценарий наблюдения">
      <div className="scenario-header">
        <span className="scenario-letter">{clip.letter}</span>
        <div>
          <span className="card-kicker">
            ТЕХНИЧЕСКИЙ СЦЕНАРИЙ · НЕ ЭТАЛОН ТЕХНИКИ
          </span>
          <h2>{clip.title}</h2>
        </div>
        <label className="scenario-select">
          Сценарий
          <select
            aria-label="Выбрать технический сценарий"
            value={scenario}
            onChange={(e) => onScenario(e.target.value as ScenarioId)}
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="scenario-goal">{clip.goal}</p>
      <div className="scenario-context">
        <div>
          <h3>
            <Eye size={15} />
            Что наблюдать
          </h3>
          <p>{clip.observe}</p>
        </div>
        <div>
          <h3>Граница интерпретации</h3>
          <p>{clip.limitation}</p>
        </div>
      </div>
      <div className="scenario-phase">
        <span data-testid="phase-label">{phaseLabel(frame, scenario)}</span>
        <div className="keyframes" role="group" aria-label="Ключевые состояния">
          {[0, 60, 120, 180, 240].map((f, i) => (
            <button
              key={f}
              aria-label={`Перейти к кадру ${f}`}
              aria-pressed={frame === f}
              onClick={() => onSeek(f)}
              title={clip.phases[i]}
            >
              {f === 0 ? "Начало" : f === 240 ? "Возврат" : `${f / 30} с`}
            </button>
          ))}
        </div>
        <button className="text-button" onClick={onRecommended}>
          Рекомендуемый ракурс
          <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  );
}
export function ObservationTools({
  guides,
  onGuides,
  marker,
  onMarker,
  frame,
  scenario,
}: {
  guides: Guides;
  onGuides: (g: Guides) => void;
  marker: MarkerId;
  onMarker: (m: MarkerId) => void;
  frame: number;
  scenario: ScenarioId;
}) {
  const p = markerPoint(sampleMotion(frame, scenario), marker);
  return (
    <div className="observation-tools">
      <h3>
        <Layers3 size={16} />
        Включаемые ориентиры
      </h3>
      <div className="guide-toggles">
        {(
          [
            { key: "joints", label: "Суставы и сегменты" },
            { key: "body", label: "Оси корпуса" },
            { key: "skis", label: "Оси лыж" },
          ] as const
        ).map((g) => (
          <label key={g.key}>
            <input
              type="checkbox"
              checked={guides[g.key]}
              onChange={(e) =>
                onGuides({ ...guides, [g.key]: e.target.checked })
              }
            />
            {g.label}
          </label>
        ))}
      </div>
      <label className="marker-select" htmlFor="marker">
        Отслеживаемая точка
        <select
          id="marker"
          value={marker}
          onChange={(e) => onMarker(e.target.value as MarkerId)}
        >
          {MARKERS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <p className="coordinate-readout" data-testid="marker-coordinates">
        X {p[0].toFixed(3)} · Y {p[1].toFixed(3)} · Z {p[2].toFixed(3)}
        <span>Условные координаты сцены; не измерение человека.</span>
      </p>
    </div>
  );
}
export function ComparisonReadout({
  a,
  b,
  scenario,
}: {
  a: number;
  b: number;
  scenario: ScenarioId;
}) {
  const items = compareStates(a, b, scenario),
    clip = SCENARIOS.find((s) => s.id === scenario)!;
  return (
    <section
      className="comparison-readout panel"
      data-testid="comparison-summary"
    >
      <div className="section-heading">
        <h2>Что отличается между A и B</h2>
        <span>Один клип · геометрия модели</span>
      </div>
      <p>
        <strong>A:</strong> {phaseLabel(a, scenario)}. <strong>B:</strong>{" "}
        {phaseLabel(b, scenario)}.
      </p>
      <div className="difference-grid">
        {items.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>
              {item.value > 0 ? "+" : ""}
              {item.value.toFixed(item.unit === "°" ? 1 : 3)} {item.unit}
            </strong>
          </div>
        ))}
      </div>
      <p className="comparison-boundary">
        Разность B − A, а не оценка правильности или безопасности.{" "}
        {clip.limitation}
      </p>
      <p className="comparison-local">
        Положение R выровнено локально. Меняйте кадр на шкале и нажимайте
        «Сохранить A/B»; здесь сравниваются статические состояния, не две
        анимации.
      </p>
    </section>
  );
}
