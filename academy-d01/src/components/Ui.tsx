import { X, ArrowUpRight, Check } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
export function PageTitle({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 tabIndex={-1} id="page-title">
          {title}
        </h1>
        <p className="subtle">{text}</p>
      </div>
      {action}
    </div>
  );
}
export function LabLink({
  children = "Открыть Motion Lab",
}: {
  children?: ReactNode;
}) {
  return (
    <Link className="button dark" to="/lab">
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function DemoTag() {
  return (
    <span className="demo-tag">
      <span />
      Пример данных · D0.3
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Закрыть окно"
        >
          <X size={20} />
        </button>
      </div>
      {children}
      <button className="button dark dialog-done" onClick={onClose}>
        Понятно
        <Check size={17} />
      </button>
    </dialog>
  );
}
