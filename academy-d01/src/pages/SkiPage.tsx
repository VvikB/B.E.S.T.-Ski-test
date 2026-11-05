import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Footprints,
  Layers3,
  Map,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { DemoTag, Modal, PageTitle } from "../components/Ui";
import { MountainArt } from "../components/Art";
const routeSteps = [
  "Познакомиться с маршрутом",
  "Исследовать модель опоры",
  "Разобрать наблюдение",
];
export default function SkiPage() {
  const [routeOpen, setRouteOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [competency, setCompetency] = useState<string | null>(null);
  return (
    <>
      <PageTitle
        eyebrow="B.E.S.T. SKI / МОЯ АКАДЕМИЯ"
        title="У каждого движения есть начало."
        text="Ваше пространство, чтобы понимать, исследовать и двигаться осознанно."
        action={<DemoTag />}
      />
      <section className="ski-hero">
        <div className="hero-copy">
          <span className="overline">
            <span className="little-line" />
            ВАШ ПЕРВЫЙ МАРШРУТ
          </span>
          <h2>
            Сначала контроль.
            <br />
            Потом —<br />
            <em>уверенность.</em>
          </h2>
          <p>
            Начните с Balance: изучите пространство опоры и посмотрите на
            движение с новой стороны.
          </p>
          <button className="button dark" onClick={() => setRouteOpen(true)}>
            Открыть маршрут
            <ArrowUpRight size={18} />
          </button>
          <div className="hero-meta">
            <ShieldCheck size={15} />
            Учебный маршрут находится в проекте
          </div>
        </div>
        <div className="hero-art">
          <MountainArt />
          <div className="art-coordinate">
            B / BALANCE <span>01 — ИССЛЕДОВАНИЕ</span>
          </div>
          <div className="floating-art-label">
            <div className="label-square">B</div>
            <span>
              Найдите свою опору<small>Технический обзор · не инструкция</small>
            </span>
          </div>
        </div>
      </section>
      <div className="section-heading">
        <h2>Четыре части одного движения</h2>
        <span>Методика B.E.S.T.</span>
      </div>
      <div className="competency-grid">
        {[
          { letter: "B", name: "Balance", ru: "Баланс", color: "sage" },
          {
            letter: "E",
            name: "Edge Control",
            ru: "Управление кантами",
            color: "sand",
          },
          {
            letter: "S",
            name: "Steering",
            ru: "Направление движения",
            color: "blue",
          },
          { letter: "T", name: "Trust", ru: "Уверенность", color: "rose" },
        ].map((c) => (
          <button
            key={c.letter}
            className={`competency-card ${c.color}`}
            onClick={() => setCompetency(c.name)}
          >
            <div className="competency-top">
              <span>{c.letter}</span>
              <ArrowUpRight size={17} />
            </div>
            <h3>{c.name}</h3>
            <p>{c.ru}</p>
            <div className="mini-progress">
              <span />
            </div>
            <small>Проект программы</small>
          </button>
        ))}
      </div>
      <div className="two-cards">
        <section className="panel next-card">
          <div className="section-heading">
            <span className="card-kicker">
              <Map size={18} />
              МАРШРУТ BALANCE
            </span>
            <span className="muted-pill">Пример</span>
          </div>
          <h2>Один понятный шаг за раз</h2>
          <div className="route-list">
            {routeSteps.map((s, i) => (
              <div key={s}>
                <span
                  className={
                    checked.includes(i) ? "route-number done" : "route-number"
                  }
                >
                  {checked.includes(i) ? <Check size={15} /> : `0${i + 1}`}
                </span>
                <span>{s}</span>
                {i === 1 && (
                  <span className="route-time">
                    <Clock3 size={12} />В своём темпе
                  </span>
                )}
              </div>
            ))}
          </div>
          <button className="text-button" onClick={() => setRouteOpen(true)}>
            Посмотреть шаги
            <ArrowRight size={17} />
          </button>
        </section>
        <section className="panel lab-promo">
          <div className="section-heading">
            <span className="card-kicker">
              <ScanLine size={18} />
              MOTION LAB
            </span>
            <span className="muted-pill">3D + SVG</span>
          </div>
          <h2>
            Посмотрите на движение
            <br />с другой стороны.
          </h2>
          <p>
            Поверните модель, остановите кадр и сравните два состояния одного
            клипа.
          </p>
          <Link to="/lab" className="button light">
            Исследовать движение
            <ArrowUpRight size={17} />
          </Link>
          <span className="lab-promo-orbit" aria-hidden="true" />
        </section>
      </div>
      <section className="practice-strip">
        <div className="round-icon">
          <Footprints size={23} />
        </div>
        <div>
          <h3>Практика начинается с договорённости</h3>
          <p>Экранная модель не заменяет наблюдение инструктора.</p>
        </div>
        <button className="text-button" onClick={() => setPracticeOpen(true)}>
          Как это устроено
          <ArrowRight size={17} />
        </button>
      </section>
      {routeOpen && (
        <Modal
          title="Balance · интерфейсный маршрут"
          onClose={() => setRouteOpen(false)}
        >
          <p>
            Это пример структуры. Отметки ниже показывают только работу
            интерфейса и не подтверждают освоение навыка. Они сбрасываются при
            обновлении страницы.
          </p>
          <div className="checklist">
            {routeSteps.map((s, i) => (
              <label key={s}>
                <input
                  type="checkbox"
                  checked={checked.includes(i)}
                  onChange={() =>
                    setChecked((prev) =>
                      prev.includes(i)
                        ? prev.filter((x) => x !== i)
                        : [...prev, i],
                    )
                  }
                />
                {s}
                {i === 1 && (
                  <Link to="/lab" onClick={() => setRouteOpen(false)}>
                    Открыть Lab
                    <ArrowUpRight size={14} />
                  </Link>
                )}
              </label>
            ))}
          </div>
          <p className="notice">
            <Layers3 size={18} />
            Лаборатория — техническая сцена. Учебные материалы требуют отдельной
            приёмки.
          </p>
        </Modal>
      )}
      {practiceOpen && (
        <Modal
          title="Практика и цифровой прогресс"
          onClose={() => setPracticeOpen(false)}
        >
          <p>
            <strong>KNOW</strong> — понимание. <strong>LAB</strong> — экранная
            задача. <strong>OBS</strong> — реальное наблюдение назначенного
            инструктора. <strong>ASSESS</strong> — отдельная аттестация.
          </p>
          <p>
            В D0.1 нет реальных назначений, учебного допуска и сертификатов.
            Пилот с сохранением данных будет отдельным этапом P0.1.
          </p>
        </Modal>
      )}
      {competency && (
        <Modal
          title={`${competency} · проект раздела`}
          onClose={() => setCompetency(null)}
        >
          <p>
            Раздел входит в проектную программу B.E.S.T. Academy. Сейчас
            доступна нейтральная техническая лаборатория; методически принятые
            уроки ещё не публиковались.
          </p>
          <Link
            className="button outline"
            to="/lab"
            onClick={() => setCompetency(null)}
          >
            Открыть лабораторию
            <ArrowUpRight size={16} />
          </Link>
        </Modal>
      )}
    </>
  );
}
