import { Suspense, lazy, useEffect, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  MountainSnow,
  Compass,
  Shapes,
  ScanLine,
  PanelTop,
  ArrowUpRight,
  ShieldCheck,
  CircleHelp,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import SkiPage from "./pages/SkiPage";
import KidsPage from "./pages/KidsPage";
import ProPage from "./pages/ProPage";
import { Modal } from "./components/Ui";
const MotionLab = lazy(() => import("./lab/MotionLab"));
const nav = [
  {
    to: "/ski",
    label: "B.E.S.T. Ski",
    sub: "Взрослая академия",
    icon: Compass,
  },
  {
    to: "/kids",
    label: "B.E.S.T. Kids",
    sub: "Открывать мир вместе",
    icon: Shapes,
  },
  {
    to: "/pro",
    label: "B.E.S.T. Pro",
    sub: "Пространство инструктора",
    icon: PanelTop,
  },
];
export default function App() {
  const location = useLocation();
  const [help, setHelp] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = window.setTimeout(
      () =>
        document.getElementById("page-title")?.focus({ preventScroll: true }),
      70,
    );
    return () => clearTimeout(timer);
  }, [location.pathname]);
  const current =
    location.pathname === "/lab"
      ? "Motion Lab"
      : nav.find((n) => n.to === location.pathname)?.label || "Академия";
  return (
    <>
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <aside className="sidebar">
        <NavLink
          to="/ski"
          className="brand"
          aria-label="B.E.S.T. Academy — главная"
        >
          <span className="brand-symbol">
            <MountainSnow size={25} strokeWidth={1.6} />
          </span>
          <span>
            B.E.S.T.<small>ACADEMY</small>
          </span>
        </NavLink>
        <div className="side-caption">ВАШЕ ПРОСТРАНСТВО</div>
        <nav aria-label="Пространства академии">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `side-link ${isActive ? "active" : ""}`
              }
            >
              <n.icon size={21} />
              <span>
                {n.label}
                <small>{n.sub}</small>
              </span>
              <ChevronRight className="side-chevron" size={15} />
            </NavLink>
          ))}
        </nav>
        <div className="side-caption tool-caption">ИССЛЕДОВАТЬ</div>
        <NavLink
          className={({ isActive }) =>
            `side-link lab-side ${isActive ? "active" : ""}`
          }
          to="/lab"
        >
          <ScanLine size={21} />
          <span>
            Motion Lab<small>Движение в пространстве</small>
          </span>
          <span className="tiny-tag">3D</span>
        </NavLink>
        <div className="side-note">
          <div className="round-icon">
            <Sparkles size={18} />
          </div>
          <h3>
            Маленький шаг.
            <br />
            Новая перспектива.
          </h3>
          <p>
            Контроль → Уверенность
            <br />→ Движение
          </p>
          <NavLink to="/lab">
            Исследовать движение
            <ArrowUpRight size={15} />
          </NavLink>
        </div>
        <div className="sidebar-bottom">
          <ShieldCheck size={17} />
          <span>
            Техническая демонстрация<small>Без реальных данных учеников</small>
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Академия
            <ChevronRight size={14} />
            <span>{current}</span>
          </div>
          <span className="top-status">
            <span />
            Закрытая демонстрация D0.2
          </span>
          <button
            className="help-button"
            aria-label="О демонстрации"
            onClick={() => setHelp(true)}
          >
            <CircleHelp size={19} />
          </button>
          <div className="avatar" aria-label="Демонстрационный профиль">
            Д
          </div>
        </header>
        <main
          id="main"
          className={location.pathname === "/lab" ? "main lab-main" : "main"}
        >
          <Suspense
            fallback={
              <div className="loading-state" role="status">
                Загружаем пространство движения…
              </div>
            }
          >
            <Routes>
              <Route path="/ski" element={<SkiPage />} />
              <Route path="/kids" element={<KidsPage />} />
              <Route path="/pro" element={<ProPage />} />
              <Route path="/lab" element={<MotionLab />} />
              <Route path="*" element={<Navigate to="/ski" replace />} />
            </Routes>
          </Suspense>
          <footer className="app-footer">
            <span>
              B.E.S.T. Academy <span className="footer-dot">·</span> Технический
              прототип
            </span>
            <button onClick={() => setHelp(true)}>
              Границы демонстрации
              <ArrowUpRight size={13} />
            </button>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {[
          ...nav,
          { to: "/lab", label: "Motion Lab", sub: "", icon: ScanLine },
        ].map((n) => (
          <NavLink key={n.to} to={n.to}>
            <n.icon size={21} />
            <span>{n.label.replace("B.E.S.T. ", "")}</span>
          </NavLink>
        ))}
      </nav>
      {help && (
        <Modal title="О демонстрации D0.2" onClose={() => setHelp(false)}>
          <p>
            Это закрытый технический прототип интерфейсов и нейтрального
            движения. Все профили, группы и наблюдения синтетические. Изменения
            в заданиях хранятся только в памяти текущей страницы.
          </p>
          <p>
            3D-движение не утверждено методически и не является инструкцией
            катания. Реальная практика, экзамены и выдача сертификатов здесь не
            реализованы. Проверка на физическом iPhone ещё не проведена.
          </p>
        </Modal>
      )}
    </>
  );
}
