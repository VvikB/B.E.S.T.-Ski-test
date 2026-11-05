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
import { AlpinePanorama } from "../components/Art";
import { BalancePreview, usePreview } from "../components/BalancePreview";
const routeSteps = [
  "Познакомиться с маршрутом",
  "Исследовать модель опоры",
  "Разобрать наблюдение",
];
export default function SkiPage() {
  const { state: preview } = usePreview();
  const [overview, setOverview] = useState<
    "demo" | "progress" | "profile" | null
  >(null);
  const labUrl = `/lab?scenario=balance&frame=${preview.frame}&view=${preview.view}`;
  const material = { publication: "draft", audience: "demo" } as const;
  const progress = { mode: "demo", persistent: false } as const;
  const [routeOpen, setRouteOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [competency, setCompetency] = useState<string | null>(null);
  return (
    <>
      <div className="ski-intro">
        <AlpinePanorama />
        <PageTitle
          eyebrow="B.E.S.T. SKI / МОЯ АКАДЕМИЯ"
          title="Мой маршрут"
          text="Увидеть. Понять. Обсудить с инструктором."
        />
      </div>

      <section
        className="continue-card"
        id="continue"
        data-publication={material.publication}
        data-progress={progress.mode}
      >
        <div className="continue-copy">
          <span className="overline">ВАШ СЛЕДУЮЩИЙ ШАГ / BALANCE</span>
          <h2>
            Продолжить
            <br />
            обучение
          </h2>
          <p className="lesson-name">B-01 · Устойчивая стойка</p>
          <p>
            Наблюдайте положение корпуса, коленей и лыж. Сравните состояния
            одной модели с разных сторон.
          </p>
          <span className="draft-chip publication-chip">
            Методический черновик
          </span>
          <div className="continue-actions">
            <button className="button dark" onClick={() => setOverview("demo")}>
              Открыть демонстрацию
              <ArrowRight size={18} />
            </button>
            <Link className="button outline" to={labUrl}>
              Открыть 3D Lab
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="lesson-meta">
            <span>
              <Clock3 size={16} />
              8–12 минут теории · ориентир
            </span>
          </div>
          <p className="publication-note">
            Урок ещё не опубликован. Сейчас доступна техническая демонстрация, а
            не обучение технике катания.
          </p>
          <DemoTag />
          <span className="storage-note">
            <ShieldCheck size={16} />
            Без аккаунта и постоянного прогресса
          </span>
        </div>
        <BalancePreview />
      </section>
      <nav className="learning-nav" aria-label="Учебная навигация">
        <a href="#continue">Обучение</a>
        <a href="#best-sections">Разделы B.E.S.T.</a>
        <Link to={labUrl}>3D Lab</Link>
        <button onClick={() => setOverview("progress")}>Мой прогресс</button>
        <button onClick={() => setOverview("profile")}>Демо-профиль</button>
      </nav>
      <div id="best-sections" className="section-heading">
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
            Открыть маршрут
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
      {overview && (
        <Modal
          title={
            overview === "demo"
              ? "Balance · доступная демонстрация"
              : overview === "progress"
                ? "Мой прогресс · демо"
                : "Профиль · демонстрационный режим"
          }
          onClose={() => setOverview(null)}
        >
          {overview === "demo" ? (
            <>
              <p>
                Выберите ракурс и состояние. Это технический просмотр модели;
                полный урок B-01 ожидает методической приёмки.
              </p>
              <BalancePreview />
              <Link className="button dark" to={labUrl}>
                Продолжить в Motion Lab
                <ArrowUpRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <p>
                Вы не вошли в учётную запись. Backend и постоянное хранение пока
                не подключены. Просмотр схемы не означает освоение теории или
                практики.
              </p>
              <p>
                Выбор ракурса и состояния хранится только в памяти этой вкладки
                до перезагрузки. Реальных результатов учеников здесь нет.
              </p>
              {overview === "progress" && (
                <p>
                  Публикация B-01: черновик. Прогресс ученика: не подтверждён.
                  Практика: не назначена.
                </p>
              )}
            </>
          )}
        </Modal>
      )}
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
            В D0.3 нет реальных назначений, учебного допуска и сертификатов.
            Урок P0.1 и хранение P0.2 остаются отдельными этапами.
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
            доступны технические сценарии B/E/S/T; методически принятые уроки
            ещё не публиковались.
          </p>
          <Link
            className="button outline"
            to={`/lab?scenario=${({ Balance: "balance", "Edge Control": "edge", Steering: "steering", Trust: "trust" } as Record<string, string>)[competency]}&frame=0`}
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
