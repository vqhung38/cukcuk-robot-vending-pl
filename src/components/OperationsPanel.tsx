import { useState } from "react";
import { canOperate, type Actor } from "../access";
import { platformData, type PlatformCommand } from "../platform";
import type { SalesState } from "../sales";
import type { Ticket } from "../platformTypes";
export const ticketLabels = {
  open: "Mới mở",
  assigned: "Đã phân công",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
};
function TicketCard({
  ticket: t,
  state,
  actor,
  send,
}: {
  ticket: Ticket;
  state: SalesState;
  actor: Actor;
  send: (c: PlatformCommand) => void;
}) {
  const [assignee, setAssignee] = useState(t.assignee ?? "ops-1");
  const [progress, setProgress] = useState(Math.max(10, t.progress));
  const [note, setNote] = useState("");
  const [result, setResult] = useState("");
  const [verified, setVerified] = useState(false);
  const history = platformData(state).history.filter(
    (h) => h.entityId === t.id,
  );
  const at = () => new Date().toISOString();
  const editable = canOperate(actor) && t.status !== "resolved";
  return (
    <section className="panel slice-card" aria-label={`Phiếu ${t.id}`}>
      <h3>{t.id}</h3>
      <p>
        {t.robotId} · {ticketLabels[t.status]} · {t.progress}% · Phụ trách:{" "}
        {t.assignee ?? "Chưa gán"}
      </p>
      {editable && (
        <>
          <div className="slice-inline">
            <label className="field">
              Người phụ trách
              <select
                aria-label="Người phụ trách"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="ops-1">Kỹ thuật An</option>
                <option value="ops-2">Vận hành Bình</option>
              </select>
            </label>
            <button
              className="button"
              onClick={() =>
                send({ type: "ticket_assign", id: t.id, assignee, at: at() })
              }
            >
              Gán người phụ trách
            </button>
          </div>
          {t.assignee && (
            <>
              <form
                className="slice-inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  send({
                    type: "ticket_progress",
                    id: t.id,
                    progress,
                    note,
                    at: at(),
                  });
                }}
              >
                <label className="field">
                  Tiến độ (%)
                  <input
                    type="number"
                    min={Math.max(1, t.progress)}
                    max="99"
                    required
                    value={progress}
                    onChange={(e) => setProgress(e.target.valueAsNumber)}
                  />
                </label>
                <label className="field">
                  Ghi chú tiến độ
                  <input
                    required
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                <button className="button">Cập nhật tiến độ</button>
              </form>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send({
                    type: "ticket_resolve",
                    id: t.id,
                    result,
                    verified,
                    at: at(),
                  });
                }}
              >
                <label className="field">
                  Kết quả khắc phục
                  <textarea
                    required
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                  />
                </label>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                  />
                  Đã kiểm tra kết nối và pha thử đạt (giả lập)
                </label>
                <button
                  className="button primary"
                  disabled={
                    !verified || !result.trim() || t.status !== "in_progress"
                  }
                >
                  Ghi kết quả và khôi phục
                </button>
              </form>
            </>
          )}
        </>
      )}
      {t.result && <p>Kết quả: {t.result}</p>}
      {t.verifiedAt && (
        <p>
          Kiểm tra đạt: {t.verifiedBy} · {t.verifiedAt}
        </p>
      )}
      <details>
        <summary>Lịch sử phiếu ({history.length})</summary>
        <ul className="history-list">
          {history.map((h) => (
            <li key={h.id}>
              {h.at} · {h.actor} · {h.from} → {h.to} · {h.note}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
export function OperationsPanel({
  state,
  actor,
  send,
}: {
  state: SalesState;
  actor: Actor;
  send: (c: PlatformCommand) => void;
}) {
  const [robotId, setRobotId] = useState(state.robots[0]?.id ?? "");
  const [fault, setFault] = useState<"offline" | "error">("error");
  const [message, setMessage] = useState("Lỗi cụm pha chế cần kiểm tra");
  const p = platformData(state);
  const alerts = state.incidents.filter(
    (i) =>
      !p.tickets.some((t) => t.incidentId === i.id && t.status === "resolved"),
  );
  return (
    <div className="operations-slice">
      <section className="panel slice-card">
        <h2>Vận hành robot</h2>
        <p>
          Sự cố → cảnh báo → phiếu → phân công → tiến độ → kết quả kiểm tra →
          khôi phục. Chỉ mô phỏng.
        </p>
        {canOperate(actor) && (
          <form
            className="slice-inline"
            onSubmit={(e) => {
              e.preventDefault();
              send({
                type: "incident",
                id: `INC-${crypto.randomUUID()}`,
                robotId,
                fault,
                message,
                at: new Date().toISOString(),
              });
            }}
          >
            <label className="field">
              Robot phát sinh sự cố
              <select
                aria-label="Robot phát sinh sự cố"
                value={robotId}
                onChange={(e) => setRobotId(e.target.value)}
              >
                {state.robots.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Loại sự cố
              <select
                aria-label="Loại sự cố"
                value={fault}
                onChange={(e) => setFault(e.target.value as typeof fault)}
              >
                <option value="error">Lỗi pha chế</option>
                <option value="offline">Mất kết nối</option>
              </select>
            </label>
            <label className="field">
              Mô tả sự cố
              <input
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <button className="button primary">Phát sinh sự cố</button>
          </form>
        )}
      </section>
      <section className="panel slice-card">
        <h2>Cảnh báo sự cố chưa giải quyết ({alerts.length})</h2>
        {!alerts.length && <p>Không có sự cố đang mở.</p>}
        {alerts.map((i) => (
          <div className="slice-alert" key={i.id}>
            <div>
              <strong>
                {i.robotId} · {i.message}
              </strong>
              <p>
                {i.id} · {i.createdAt}
              </p>
            </div>
            {canOperate(actor) &&
              !p.tickets.some((t) => t.incidentId === i.id) && (
                <button
                  className="button"
                  onClick={() =>
                    send({
                      type: "ticket_open",
                      incidentId: i.id,
                      robotId: i.robotId,
                      at: new Date().toISOString(),
                    })
                  }
                >
                  Mở phiếu xử lý
                </button>
              )}
          </div>
        ))}
      </section>
      <h2>Phiếu xử lý sự cố</h2>
      {p.tickets.map((t) => (
        <TicketCard
          key={t.id}
          ticket={t}
          state={state}
          actor={actor}
          send={send}
        />
      ))}
      <section className="panel slice-card">
        <h2>Lịch sử trạng thái vận hành</h2>
        <ul className="history-list">
          {p.history
            .filter((h) => h.kind === "operation")
            .map((h) => (
              <li key={h.id}>
                {h.at} · {h.robotId} · {h.actor} · {h.from} → {h.to} · {h.note}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
