import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  HeartHandshake,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { MountainArt, SkiViews } from "../components/Art";
import { DemoTag, Modal, PageTitle } from "../components/Ui";
export default function KidsPage() {
  const [choice, setChoice] = useState<"top" | "side" | null>(null);
  const [answer, setAnswer] = useState(false);
  const [help, setHelp] = useState(false);
  return (
    <div className="kids-space">
      <PageTitle
        eyebrow="B.E.S.T. KIDS / МАЛЕНЬКИЕ ОТКРЫТИЯ"
        title="Привет! Посмотрим по-новому?"
        text="Одна маленькая задача. Целый мир новых наблюдений."
        action={<DemoTag />}
      />
      <section className="kids-hero">
        <div className="hero-copy">
          <span className="overline">
            <Star size={16} />
            ТВОЙ СЛЕДУЮЩИЙ ШАГ
          </span>
          <h2>
            Большое открытие
            <br />
            начинается
            <br />
            <em>с любопытства.</em>
          </h2>
          <p>
            Это Рыжик — наш собственный персонаж.
            <br />
            Он любит смотреть на вещи с разных сторон.
          </p>
          <a className="button dark" href="#kids-task">
            Попробуем вместе
            <ArrowRight size={18} />
          </a>
          <span className="hero-meta">Без спешки. Без соревнования.</span>
        </div>
        <div className="hero-art">
          <MountainArt kids />
          <span className="kids-sticker">
            <Sparkles size={18} />У каждого свой темп
          </span>
        </div>
      </section>
      <div className="kids-layout">
        <section className="panel kids-task" id="kids-task" tabIndex={-1}>
          <span className="card-kicker">
            <Sparkles size={17} />
            ЗАДАЧА НА НАБЛЮДАТЕЛЬНОСТЬ
          </span>
          <h2>Где видны две лыжи целиком?</h2>
          <p>
            На наших условных рисунках они выглядят по-разному.
            <br />
            Выбери вид, где можно разглядеть обе лыжи по длине.
          </p>
          <div className="choice-grid">
            {(["top", "side"] as const).map((v) => (
              <button
                key={v}
                className={`view-choice ${choice === v ? "selected" : ""}`}
                onClick={() => {
                  setChoice(v);
                  setAnswer(false);
                }}
                aria-pressed={choice === v}
              >
                <SkiViews view={v} selected={choice === v} />
                <span>
                  {v === "top" ? "Сверху" : "Сбоку"}
                  <span className="choice-radio">
                    {choice === v && <Check size={13} />}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="task-actions">
            <button
              className="button dark"
              disabled={!choice}
              onClick={() => setAnswer(true)}
            >
              Посмотреть ответ
              <ArrowRight size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Сбросить выбор"
              onClick={() => {
                setChoice(null);
                setAnswer(false);
              }}
            >
              <RotateCcw size={18} />
            </button>
          </div>
          {answer && (
            <div
              className={`feedback ${choice === "top" ? "success" : ""}`}
              role="status"
            >
              {choice === "top"
                ? "Да! На виде сверху видны обе лыжи по длине. Ты заметил разницу в ракурсе."
                : "На виде сбоку лыжи перекрываются. Попробуй выбрать вид сверху — там видна их длина."}
              <small>
                Это наблюдение за рисунком, а не проверка навыка катания.
              </small>
            </div>
          )}
        </section>
        <aside className="kids-aside">
          <section className="panel together-card">
            <div className="round-icon">
              <HeartHandshake size={24} />
            </div>
            <h2>Вместе спокойнее</h2>
            <p>
              Если что-то непонятно, можно остановиться и попросить взрослого
              объяснить.
            </p>
            <button className="text-button" onClick={() => setHelp(true)}>
              Попросить объяснить
              <ArrowRight size={16} />
            </button>
          </section>
          <section className="panel little-lab">
            <span className="card-kicker">НОВАЯ ПЕРСПЕКТИВА</span>
            <h3>А если модель повернуть?</h3>
            <p>В лаборатории это возможно. Вместе со взрослым.</p>
            <Link to="/lab" className="text-button">
              В Motion Lab
              <ArrowUpRight size={16} />
            </Link>
          </section>
        </aside>
      </div>
      <p className="kids-boundary">
        Интерфейсный пример на синтетических данных. Детские профили и реальное
        обучение не подключены.
      </p>
      {help && (
        <Modal title="Можно попросить объяснить" onClose={() => setHelp(false)}>
          <p>
            Скажи взрослому рядом: «Я хочу понять, чем эти два рисунка
            отличаются. Посмотрим вместе?»
          </p>
          <p>
            Это подсказка на экране. Сообщение никому не отправляется, открытого
            чата здесь нет.
          </p>
        </Modal>
      )}
    </div>
  );
}
