import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  FileCheck2,
  MessageSquareText,
  Plus,
  Users,
} from "lucide-react";
import { AlpinePanorama } from "../components/Art";
import { DemoTag, Modal, PageTitle } from "../components/Ui";
const learners = [
  {
    id: "A",
    label: "Демо-ученик A",
    initials: "А",
    goal: "Познакомиться с моделью опоры",
    status: "План",
    color: "sage",
  },
  {
    id: "B",
    label: "Демо-ученик B",
    initials: "Б",
    goal: "Различить ракурсы на схеме",
    status: "Обсудить",
    color: "sand",
  },
  {
    id: "C",
    label: "Демо-ученик C",
    initials: "В",
    goal: "Сформулировать вопрос инструктору",
    status: "План",
    color: "blue",
  },
];
export default function ProPage() {
  const [group, setGroup] = useState("balance");
  const [selected, setSelected] = useState(learners[0]);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [modal, setModal] = useState<"plan" | "method" | null>(null);
  const [plan, setPlan] = useState<string[]>([]);
  const visible = group === "balance" ? learners : learners.slice(1);
  return (
    <div className="pro-space">
      <div className="pro-heading">
        <AlpinePanorama />
        <PageTitle
          eyebrow="B.E.S.T. PRO / КАБИНЕТ ИНСТРУКТОРА"
          title="Кабинет инструктора"
          text="Планируйте, наблюдайте, обсуждайте. Сохраняйте границы каждого вывода."
          action={<DemoTag />}
        />
      </div>
      <div className="pro-summary">
        <section className="summary-item">
          <span className="summary-icon sage">
            <Users size={22} />
          </span>
          <div>
            <small>Синтетическая группа</small>
            <strong>{visible.length} профиля</strong>
          </div>
          <span className="muted-pill">Пример</span>
        </section>
        <section className="summary-item">
          <span className="summary-icon sand">
            <ClipboardList size={22} />
          </span>
          <div>
            <small>Фокус встречи</small>
            <strong>Balance · знакомство</strong>
          </div>
        </section>
        <section className="summary-item">
          <span className="summary-icon blue">
            <FileCheck2 size={22} />
          </span>
          <div>
            <small>Статус материалов</small>
            <strong>Проект · на проверке</strong>
          </div>
        </section>
      </div>
      <div className="pro-layout">
        <section className="panel learners-panel">
          <div className="section-heading">
            <h2>Учебная группа</h2>
            <select
              aria-label="Выбрать демо-группу"
              value={group}
              onChange={(e) => {
                const val = e.target.value;
                setGroup(val);
                setSelected(val === "balance" ? learners[0] : learners[1]);
                setNote(notes[val === "balance" ? "A" : "B"] || "");
                setSaved(false);
              }}
            >
              <option value="balance">Balance · пример</option>
              <option value="views">Ракурсы · пример</option>
            </select>
          </div>
          <div className="table-caption">
            <span>ПРОФИЛЬ И ЦЕЛЬ</span>
            <span>СОСТОЯНИЕ</span>
          </div>
          {visible.map((l) => (
            <button
              key={l.id}
              className={`learner-row ${selected.id === l.id ? "selected" : ""}`}
              onClick={() => {
                setSelected(l);
                setNote(notes[l.id] || "");
                setSaved(false);
              }}
              aria-pressed={selected.id === l.id}
            >
              <span className={`learner-avatar ${l.color}`}>{l.initials}</span>
              <span className="learner-info">
                <strong>{l.label}</strong>
                <small>{l.goal}</small>
              </span>
              <span className={`status-pill ${l.color}`}>{l.status}</span>
              <ArrowRight size={16} />
            </button>
          ))}
          <p className="table-footnote">
            Все профили вымышленные. Реальных результатов и персональных данных
            нет.
          </p>
        </section>
        <section className="panel observation-panel">
          <span className="card-kicker">
            <MessageSquareText size={17} />
            ИНТЕРФЕЙСНЫЙ ПРИМЕР НАБЛЮДЕНИЯ
          </span>
          <h2>{selected.label}</h2>
          <p>
            Разделите факт, предположение и вопрос. Не вводите реальные
            персональные или медицинские данные.
          </p>
          <label htmlFor="observation">
            Заметка для демонстрационного профиля
          </label>
          <textarea
            id="observation"
            value={note}
            maxLength={600}
            rows={3}
            placeholder="Например: в обсуждении схемы возник вопрос о ракурсе…"
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
          />
          <div className="observation-actions">
            <button
              className="button dark"
              disabled={!note.trim()}
              onClick={() => {
                setNotes((prev) => ({ ...prev, [selected.id]: note }));
                setSaved(true);
              }}
            >
              Запомнить в демо
              <Plus size={16} />
            </button>
            <span role="status">
              {saved ? (
                <>
                  <Check size={15} />В памяти страницы
                </>
              ) : (
                "Сбросится при обновлении"
              )}
            </span>
          </div>
        </section>
      </div>
      <div className="two-cards pro-bottom">
        <aside className="panel plan-panel">
          <span className="card-kicker">
            <CalendarDays size={17} />
            ПЛАН ВСТРЕЧИ
          </span>
          <h2>
            Знакомство
            <br />с Balance
          </h2>
          <p>Согласовать цель, рассмотреть модель, обсудить наблюдение.</p>
          <div className="plan-line">
            <span>01</span>Цель и условия
          </div>
          <div className="plan-line">
            <span>02</span>Модель и вопросы
          </div>
          <div className="plan-line">
            <span>03</span>Следующий шаг
          </div>
          <button className="text-button" onClick={() => setModal("plan")}>
            Открыть план
            <ArrowRight size={17} />
          </button>
        </aside>
        <section className="panel method-card">
          <span className="card-kicker">
            <FileCheck2 size={17} />
            МЕТОДИЧЕСКАЯ КАРТА
          </span>
          <div className="method-letter">
            B<span>/ 01</span>
          </div>
          <h2>Опора в спокойном положении</h2>
          <p>
            Проект цели, условий, схемы и критериев. Методическая приёмка ещё не
            выполнена.
          </p>
          <button className="text-button" onClick={() => setModal("method")}>
            Посмотреть структуру
            <ArrowRight size={17} />
          </button>
        </section>
      </div>
      {modal === "plan" && (
        <Modal title="План встречи · пример" onClose={() => setModal(null)}>
          <p>
            Чек-лист демонстрирует интерфейс. Это не назначение реального урока
            и не протокол освоения навыков.
          </p>
          <div className="checklist">
            {[
              "Согласовать цель и границы технической модели",
              "Показать виды сверху, сбоку и спереди",
              "Разделить наблюдение и предположение",
            ].map((text) => (
              <label key={text}>
                <input
                  type="checkbox"
                  checked={plan.includes(text)}
                  onChange={() =>
                    setPlan((prev) =>
                      prev.includes(text)
                        ? prev.filter((t) => t !== text)
                        : [...prev, text],
                    )
                  }
                />
                {text}
              </label>
            ))}
          </div>
        </Modal>
      )}
      {modal === "method" && (
        <Modal
          title="L-B01 · проект методической карты"
          onClose={() => setModal(null)}
        >
          <dl className="method-details">
            <dt>Цель</dt>
            <dd>Различить согласованные признаки опоры на условной модели.</dd>
            <dt>Условия</dt>
            <dd>
              Только цифровой технический обзор; без допуска к реальному склону.
            </dd>
            <dt>Материал</dt>
            <dd>
              Собственная схема и нейтральный прототип, требующие авторской
              проверки.
            </dd>
            <dt>Evidence</dt>
            <dd>
              Экранный ответ не является практическим OBS или аттестацией.
            </dd>
            <dt>Статус</dt>
            <dd>Проект. Сертификаты не выдаются.</dd>
          </dl>
        </Modal>
      )}
    </div>
  );
}
