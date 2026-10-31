import type { ReactNode } from "react";

export function Stat({
  title,
  value,
  icon,
  note,
  warning = false,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  note: string;
  warning?: boolean;
}) {
  return (
    <section className={"stat " + (warning ? "warning" : "")}>
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <small>
        {warning ? (
          <span className="amber-dot" />
        ) : (
          <span className="live-dot" />
        )}
        {note}
      </small>
    </section>
  );
}
export function PanelHeading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
export function StockRow({
  name,
  value,
  onRefill,
  canRefill = true,
}: {
  name: string;
  value: number;
  onRefill: () => void;
  canRefill?: boolean;
}) {
  return (
    <div className="stock-row">
      <div className="stock-line">
        <span>{name}</span>
        <strong className={value < 25 ? "low" : ""}>{value}%</strong>
        <button
          className="text-button"
          disabled={!canRefill}
          aria-label={"Bổ sung " + name}
          onClick={onRefill}
        >
          + Bổ sung
        </button>
      </div>
      <div className="stock-track">
        <span
          style={{
            width: value + "%",
            background: value < 25 ? "#dfa148" : "#448d6d",
          }}
        />
      </div>
    </div>
  );
}
