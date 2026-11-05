import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  Box,
  Camera,
  Columns2,
  Info,
  Layers2,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  Pause,
  Play,
  Rotate3D,
  RotateCcw,
  Route,
  ScanLine,
  SkipBack,
  SkipForward,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { DemoTag, Modal, PageTitle } from "../components/Ui";
import {
  clipManifest,
  LAST_FRAME,
  poseAtFrame,
  resolveQuality,
  SAMPLE_RATE,
  stepFrame,
} from "./motion";
import type { CameraView, Quality, RenderMode } from "./motion";
import SvgScene from "./SvgScene";
const SkierScene = lazy(() => import("./SkierScene"));
class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? (
      <div className="loading-state">3D недоступно. Переключаемся на SVG…</div>
    ) : (
      this.props.children
    );
  }
}
const cameraButtons = [
  { id: "orbit", name: "Свободно", label: "Свободная камера", icon: Rotate3D },
  { id: "top", name: "Сверху", label: "Камера сверху", icon: ArrowDownToLine },
  { id: "side", name: "Сбоку", label: "Камера сбоку", icon: MoveHorizontal },
  { id: "front", name: "Спереди", label: "Камера спереди", icon: UserRound },
] as const;
export default function MotionLab() {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<CameraView>("orbit");
  const [reset, setReset] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [mode, setMode] = useState<RenderMode>("3d");
  const [quality, setQuality] = useState<Quality>("auto");
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  const [trajectory, setTrajectory] = useState(true);
  const [compare, setCompare] = useState(false);
  const [a, setA] = useState(0);
  const [b, setB] = useState(60);
  const [info, setInfo] = useState(false);
  const [failure, setFailure] = useState(false);
  const resolvedQuality = resolveQuality(quality, compact);
  const pose = poseAtFrame(frame);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const listener = () => setCompact(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now(),
      remainder = 0,
      handle = 0;
    const tick = (now: number) => {
      remainder += (Math.min(now - last, 100) / 1000) * SAMPLE_RATE * speed;
      last = now;
      const steps = Math.floor(remainder);
      if (steps > 0) {
        remainder -= steps;
        setFrame((prev) => (prev + steps) % LAST_FRAME);
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [playing, speed]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  const fallback = useCallback(() => {
    setMode("svg");
    setView("front");
    setFailure(true);
    setPlaying(false);
  }, []);
  const chooseMode = (m: RenderMode) => {
    setMode(m);
    setView(m === "svg" ? "front" : "orbit");
    setReset((r) => r + 1);
    if (m === "3d") setFailure(false);
  };
  const step = (delta: number) => {
    setPlaying(false);
    setFrame((prev) => stepFrame(prev, delta));
  };
  return (
    <>
      <Link className="back-link" to="/ski">
        <ArrowLeft size={15} />В академию
      </Link>
      <PageTitle
        eyebrow="B.E.S.T. / MOTION LAB"
        title="Новая перспектива движения."
        text="Поверните модель. Остановите момент. Рассмотрите разницу."
        action={<DemoTag />}
      />
      <div className="technical-banner">
        <Info size={18} />
        <p>
          <strong>Техническая демонстрация.</strong> Нейтральное движение не
          утверждено методически и не является инструкцией катания.
        </p>
        <button onClick={() => setInfo(true)}>О модели</button>
      </div>
      <section className="lab-workbench" aria-label="Лаборатория движения">
        <div className="viewport-toolbar">
          <div className="render-tabs" role="group" aria-label="Представление">
            <button
              className={mode === "3d" ? "active" : ""}
              aria-pressed={mode === "3d"}
              onClick={() => chooseMode("3d")}
            >
              <Box size={16} />
              3D
            </button>
            <button
              className={mode === "svg" ? "active" : ""}
              aria-pressed={mode === "svg"}
              onClick={() => chooseMode("svg")}
            >
              <Layers2 size={16} />
              SVG
            </button>
          </div>
          <div className="quality-field">
            <label htmlFor="quality">Графика</label>
            <select
              id="quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value as Quality)}
            >
              <option value="auto">Авто</option>
              <option value="low">Экономная</option>
              <option value="high">Высокая</option>
            </select>
          </div>
          <span className="clip-id">NEUTRAL / 01</span>
        </div>
        <div
          className={`scene-container ${compare ? "comparing" : ""}`}
          data-testid="scene"
          data-mode={mode}
          data-view={view}
          data-quality={resolvedQuality}
          data-frame={frame}
        >
          {mode === "3d" ? (
            <SceneBoundary onFailure={fallback}>
              <Suspense
                fallback={
                  <div className="loading-state" role="status">
                    Загрузка 3D-движка…
                  </div>
                }
              >
                <SkierScene
                  frame={frame}
                  view={view}
                  reset={reset}
                  rotation={rotation}
                  quality={resolvedQuality}
                  trajectory={trajectory}
                  compare={compare}
                  a={a}
                  b={b}
                  onContextLost={fallback}
                />
              </Suspense>
            </SceneBoundary>
          ) : (
            <SvgScene
              frame={frame}
              view={view}
              trajectory={trajectory}
              compare={compare}
              a={a}
              b={b}
            />
          )}
          <div className="scene-corner">
            <span className="scene-indicator" />
            {mode === "3d"
              ? "3D / условная сцена"
              : "SVG / облегчённая проекция"}
          </div>
          <div className="scene-coordinates">
            Y ↑ <span>+Z — условно вперёд</span>
          </div>
          {compare && (
            <div className="compare-labels">
              <span>
                <b>A</b>
                {(a / SAMPLE_RATE).toFixed(2)} с · кадр {a}
              </span>
              <span>
                <b>B</b>
                {(b / SAMPLE_RATE).toFixed(2)} с · кадр {b}
              </span>
            </div>
          )}
          {mode === "3d" && (
            <div
              className="scene-rotate"
              role="group"
              aria-label="Клавиатурное вращение камеры"
            >
              <button
                aria-label="Повернуть камеру влево"
                onClick={() => {
                  setView("orbit");
                  setRotation((r) => r - 1);
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label="Повернуть камеру вправо"
                onClick={() => {
                  setView("orbit");
                  setRotation((r) => r + 1);
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
          <div className="scene-footer">
            <span>
              {compare
                ? "A/B · локальное выравнивание, перенос R скрыт"
                : "R — начало rig, не центр масс"}
            </span>
            <span>
              {mode === "3d"
                ? "Повернуть: потяните сцену"
                : "Свободная камера доступна в 3D"}
            </span>
          </div>
        </div>
        <div className="camera-toolbar">
          <div className="camera-buttons" role="group" aria-label="Виды камеры">
            {cameraButtons.map((c) => (
              <button
                key={c.id}
                aria-label={c.label}
                aria-pressed={view === c.id}
                className={view === c.id ? "active" : ""}
                disabled={mode === "svg" && c.id === "orbit"}
                title={
                  mode === "svg" && c.id === "orbit"
                    ? "Свободная камера доступна только в 3D"
                    : c.label
                }
                onClick={() => setView(c.id)}
              >
                <c.icon size={16} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
          <button
            className="reset-camera"
            onClick={() => {
              setView(mode === "3d" ? "orbit" : "front");
              setRotation(0);
              setReset((r) => r + 1);
            }}
            aria-label="Вернуть камеру"
          >
            <RotateCcw size={16} />
            <span>Сбросить вид</span>
          </button>
        </div>
        <div className="playback">
          <div className="playback-main">
            <button
              className="icon-button frame-step"
              onClick={() => step(-1)}
              aria-label="Предыдущий кадр"
              disabled={frame === 0}
            >
              <SkipBack size={18} />
            </button>
            <button
              className="play-button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Пауза" : "Воспроизвести"}
            >
              {playing ? (
                <Pause size={19} fill="currentColor" />
              ) : (
                <Play size={19} fill="currentColor" />
              )}
            </button>
            <button
              className="icon-button frame-step"
              onClick={() => step(1)}
              aria-label="Следующий кадр"
              disabled={frame === LAST_FRAME}
            >
              <SkipForward size={18} />
            </button>
          </div>
          <div className="timeline">
            <div className="time-label">
              <span data-testid="time">
                {pose.seconds.toFixed(2)} <small>/ 8.00 с</small>
              </span>
              <span data-testid="frame-label">
                Кадр {frame} / {LAST_FRAME}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={LAST_FRAME}
              step="1"
              value={frame}
              aria-label="Кадр на временной шкале"
              onChange={(e) => {
                setPlaying(false);
                setFrame(Number(e.target.value));
              }}
            />
          </div>
          <div className="speed-field">
            <label htmlFor="speed">Скорость</label>
            <select
              id="speed"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value="0.25">0.25×</option>
              <option value="0.5">0.5×</option>
              <option value="1">1×</option>
              <option value="2">2×</option>
            </select>
          </div>
        </div>
      </section>
      {failure && (
        <div role="status" className="fallback-notice">
          3D-контекст недоступен или был потерян. SVG сохраняет управление
          кадрами. Это не подтверждение работы 3D на устройстве. Кнопка «3D»
          повторит попытку.
        </div>
      )}
      <div className="lab-lower">
        <section className="panel lab-settings">
          <span className="card-kicker">
            <ScanLine size={17} />
            ИНСТРУМЕНТЫ НАБЛЮДЕНИЯ
          </span>
          <div className="setting-row">
            <div>
              <h3>
                <Route size={17} />
                Траектория маркера R
              </h3>
              <p>
                {compare
                  ? "В A/B перенос скрыт для сравнения поз."
                  : "Условный путь начала rig, не физического центра масс."}
              </p>
            </div>
            <button
              className={`switch ${trajectory ? "on" : ""}`}
              role="switch"
              aria-checked={trajectory}
              aria-label="Показать траекторию"
              disabled={compare}
              onClick={() => setTrajectory((v) => !v)}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <h3>
                <Columns2 size={17} />
                Сравнить A и B
              </h3>
              <p>Два момента одного клипа. Общая камера и масштаб.</p>
            </div>
            <button
              className={`switch ${compare ? "on" : ""}`}
              role="switch"
              aria-checked={compare}
              aria-label="Сравнить A и B"
              onClick={() => setCompare((v) => !v)}
            >
              <span />
            </button>
          </div>
          <div className="capture-actions">
            <button className="button outline" onClick={() => setA(frame)}>
              <Camera size={15} />
              Сохранить A<span>{(a / SAMPLE_RATE).toFixed(2)} с</span>
            </button>
            <button className="button outline" onClick={() => setB(frame)}>
              <Camera size={15} />
              Сохранить B<span>{(b / SAMPLE_RATE).toFixed(2)} с</span>
            </button>
          </div>
          <button
            className="text-button small-text"
            onClick={() => {
              setA(0);
              setB(60);
              setCompare(false);
            }}
          >
            Очистить сравнение
            <RotateCcw size={14} />
          </button>
        </section>
        <section className="panel clip-notes">
          <span className="card-kicker">О ЧЁМ ЭТА СЦЕНА</span>
          <h2>
            Наблюдать —<br />
            ещё не оценивать.
          </h2>
          <p>
            Нейтральное изменение положения лыжника и лыж создано для проверки
            интерфейса. Это не физическая симуляция и не эталон техники.
          </p>
          <dl>
            <div>
              <dt>Клип</dt>
              <dd>Neutral stance · v0.1.0</dd>
            </div>
            <div>
              <dt>Шаг</dt>
              <dd>1/30 с · 240 интервалов</dd>
            </div>
            <div>
              <dt>Качество</dt>
              <dd>
                {resolvedQuality === "low"
                  ? "Экономное · DPR 1"
                  : "Высокое · DPR ≤ 1.5"}
              </dd>
            </div>
            <div>
              <dt>Проверка iPhone</dt>
              <dd>Физическое устройство не проверено</dd>
            </div>
          </dl>
        </section>
      </div>
      {info && (
        <Modal title="Границы Motion Lab" onClose={() => setInfo(false)}>
          <p>
            Модель, геометрия лыжника, лыжи и движение созданы программно
            специально для D0.1. Чужие модели и видеозаписи не используются.
          </p>
          <p>
            Это условный rig. Его маркер R — начало модели на плоскости, не
            измеренный центр масс. Нагрузка, скорость катания, углы и качество
            техники не оцениваются. В A/B сравниваются моменты одной версии
            клипа в локальных координатах.
          </p>
          <p>
            Техническая демонстрация не разрешает самостоятельную практику.
            Учебное движение требует отдельной методической проверки и
            референсов.
          </p>
          <pre className="manifest-preview">
            {JSON.stringify(
              {
                id: clipManifest.id,
                version: clipManifest.version,
                status: clipManifest.status,
                methodicallyApproved: false,
              },
              null,
              2,
            )}
          </pre>
        </Modal>
      )}
    </>
  );
}
