import { useState } from "react";
import {
  canFinance,
  chainNames,
  sites,
  robotScope,
  type Actor,
} from "../access";
import { money } from "../data";
import {
  aggregateFinance,
  batchTransactions,
  financeMetrics,
  platformData,
  reconciliation,
  refundOutstanding,
  type PlatformCommand,
} from "../platform";
import type { SalesState } from "../sales";
import type { Batch } from "../platformTypes";
const paymentLabels = {
  pending: "Chờ thanh toán",
  unknown: "Chưa xác định",
  succeeded: "Thành công",
  failed: "Thất bại",
};
const refundLabels = {
  requested: "Đã yêu cầu",
  processing: "Đang hoàn",
  failed: "Hoàn thất bại",
  succeeded: "Hoàn thành công",
};
const at = () => new Date().toISOString();
const statusLabels: Record<string, string> = {
  matched: "Khớp",
  missing: "Thiếu sao kê",
  mismatch: "Lệch số tiền",
  duplicate: "Trùng sao kê",
  unreceived: "Chưa xác nhận tiền",
  unknown: "Không có giao dịch nguồn",
};
function BatchCard({
  batch: b,
  state,
  actor,
  send,
}: {
  batch: Batch;
  state: SalesState;
  actor: Actor;
  send: (c: PlatformCommand) => void;
}) {
  const [selected, setSelected] = useState("");
  const [amount, setAmount] = useState(0);
  const [received, setReceived] = useState(false);
  const [note, setNote] = useState("");
  const txs = batchTransactions(state, b);
  const items = reconciliation(state, b);
  return (
    <section className="panel slice-card" aria-label={`Kỳ ${b.id}`}>
      <h3>
        {b.id} {b.adjustmentOf && `(Bổ sung cho ${b.adjustmentOf})`} ·{" "}
        {sites.find((s) => s.id === b.scope.siteId)?.name}
      </h3>
      <p>
        {b.start} → {b.end} (không gồm cuối kỳ) ·{" "}
        {b.status === "closed" ? "Đã chốt" : "Đang kiểm tra"}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Giao dịch</th>
              <th>Nguồn</th>
              <th>Sao kê</th>
              <th>Chênh lệch</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, n) => (
              <tr key={`${i.transactionId}-${n}`}>
                <td>{i.transactionId}</td>
                <td>{money(i.expected)}</td>
                <td>{money(i.actual)}</td>
                <td>{money(i.expected - i.actual)}</td>
                <td>{statusLabels[i.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {actor.role === "owner" && b.status !== "closed" && (
        <>
          <form
            className="slice-inline"
            onSubmit={(e) => {
              e.preventDefault();
              send({
                type: "statement_set",
                id: b.id,
                transactionId: selected,
                amount,
                received,
                note,
                at: at(),
              });
            }}
          >
            <label className="field">
              Giao dịch sửa sao kê
              <select
                aria-label="Giao dịch sửa sao kê"
                value={selected}
                required
                onChange={(e) => {
                  setSelected(e.target.value);
                  const line = b.lines.find(
                    (l) => l.transactionId === e.target.value,
                  );
                  setAmount(line?.amount ?? 0);
                  setReceived(line?.received ?? false);
                }}
              >
                <option value="">Chọn giao dịch</option>
                {txs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Số tiền sao kê
              <input
                type="number"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.valueAsNumber)}
              />
            </label>
            <label className="field">
              Lý do sửa sao kê
              <input
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={received}
                onChange={(e) => setReceived(e.target.checked)}
              />
              Xác nhận tiền trên sao kê mẫu
            </label>
            <button className="button">Lưu sao kê mẫu</button>
          </form>
          <p>
            Sửa chỉ thay dữ liệu sao kê mẫu (gộp dòng trùng của giao dịch được
            chọn), không sửa số tiền giao dịch nguồn.
          </p>
          <button
            className="button primary"
            disabled={
              !items.length || items.some((i) => i.status !== "matched")
            }
            onClick={() => send({ type: "batch_close", id: b.id, at: at() })}
          >
            Chốt kỳ đối soát
          </button>
        </>
      )}
    </section>
  );
}
export function FinanceSummary({
  state,
  period,
}: {
  state: SalesState;
  period: string;
}) {
  const m = financeMetrics(state, period);
  return (
    <section className="panel slice-card" aria-label="Tổng hợp tài chính">
      <h2>Tiền và đối soát · chỉ giao dịch mô phỏng</h2>
      <div className="sales-numbers">
        <p>
          Giá trị đơn tạo trong kỳ<strong>{money(m.orderValue)}</strong>
        </p>
        <p>
          Doanh thu phục vụ thành công<strong>{money(m.revenue)}</strong>
        </p>
        <p>
          Giao dịch thu thành công<strong>{money(m.captured)}</strong>
        </p>
        <p>
          Đã hoàn thành công<strong>{money(m.refunded)}</strong>
        </p>
        <p>
          Tiền thu ròng<strong>{money(m.netCaptured)}</strong>
        </p>
        <p>
          Tiền đã đối soát qua sao kê mẫu<strong>{money(m.settled)}</strong>
        </p>
        <p>
          Còn cần hoàn (mọi kỳ)<strong>{money(m.outstandingRefund)}</strong>
        </p>
      </div>
      <p>
        Chỉ kỳ đã chốt với từng giao dịch khớp và tiền được xác nhận trên sao kê
        mẫu mới tính là đã đối soát. Chưa phải xác nhận ngân hàng hay payout
        thật. Doanh thu ly tốt không bị trừ thêm khi hoàn ly lỗi chưa từng được
        tính doanh thu.
      </p>
    </section>
  );
}
export function FinancePanel({
  state,
  actor,
  period,
  send,
}: {
  state: SalesState;
  actor: Actor;
  period: string;
  send: (c: PlatformCommand) => void;
}) {
  const [group, setGroup] = useState<"robot" | "site" | "chain">("robot");
  const [siteId, setSiteId] = useState("hcm-1");
  const [date, setDate] = useState(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
  );
  const [scenario, setScenario] = useState<
    "matched" | "missing" | "mismatch" | "duplicate" | "unreceived"
  >("missing");
  if (!canFinance(actor))
    return <p role="alert">Không có quyền xem dữ liệu tài chính.</p>;
  const p = platformData(state);
  return (
    <div>
      <FinanceSummary state={state} period={period} />
      <section className="panel slice-card">
        <h2>Tổng hợp giao dịch theo phạm vi</h2>
        <label className="field">
          Nhóm theo
          <select
            aria-label="Nhóm theo"
            value={group}
            onChange={(e) => setGroup(e.target.value as typeof group)}
          >
            <option value="robot">Robot</option>
            <option value="site">Điểm bán</option>
            <option value="chain">Chuỗi</option>
          </select>
        </label>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Đối tượng</th>
                <th>Giá trị đơn</th>
                <th>Doanh thu</th>
                <th>Thu tiền</th>
                <th>Hoàn tiền</th>
                <th>Đã đối soát</th>
              </tr>
            </thead>
            <tbody>
              {aggregateFinance(state, group, period).map((m) => (
                <tr key={m.id}>
                  <td>
                    {group === "chain"
                      ? chainNames[m.id]
                      : group === "site"
                        ? sites.find((s) => s.id === m.id)?.name
                        : m.id}
                  </td>
                  <td>{money(m.orderValue)}</td>
                  <td>{money(m.revenue)}</td>
                  <td>{money(m.captured)}</td>
                  <td>{money(m.refunded)}</td>
                  <td>{money(m.settled)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel slice-card">
        <h2>Thanh toán liên kết đơn hàng (mọi kỳ)</h2>
        {state.sales.length === 0 && <p>Chưa có đơn mô phỏng.</p>}
        {state.sales.map((o) => (
          <div className="slice-alert" key={o.id}>
            <div>
              <strong>{o.paymentId ?? `PAY-${o.id}`}</strong>
              <p>
                Đơn {o.id} · {o.robotId} · {money(o.total)} ·{" "}
                {paymentLabels[o.payment]}
              </p>
              <p>Còn cần hoàn: {money(refundOutstanding(state, o.id))}</p>
            </div>
            {actor.role === "owner" &&
              refundOutstanding(state, o.id) > 0 &&
              !p.refunds.some(
                (r) => r.orderId === o.id && r.status !== "succeeded",
              ) && (
                <button
                  className="button"
                  onClick={() =>
                    send({
                      type: "refund_request",
                      id: `REF-${crypto.randomUUID()}`,
                      orderId: o.id,
                      at: at(),
                    })
                  }
                >
                  Tạo yêu cầu hoàn tiền
                </button>
              )}
          </div>
        ))}
      </section>
      <section className="panel slice-card">
        <h2>Hoàn tiền mô phỏng</h2>
        {p.refunds.map((r) => (
          <div className="slice-alert" key={r.id}>
            <div>
              <strong>{r.id}</strong>
              <p>
                {r.orderId} · {r.paymentId} · {money(r.amount)} ·{" "}
                {refundLabels[r.status]}
              </p>
            </div>
            {actor.role === "owner" && r.status !== "succeeded" && (
              <div className="sale-actions">
                {r.status !== "processing" ? (
                  <button
                    className="button"
                    onClick={() =>
                      send({
                        type: "refund_status",
                        id: r.id,
                        status: "processing",
                        at: at(),
                      })
                    }
                  >
                    Bắt đầu hoàn tiền
                  </button>
                ) : (
                  <>
                    <button
                      className="button"
                      onClick={() =>
                        send({
                          type: "refund_status",
                          id: r.id,
                          status: "succeeded",
                          at: at(),
                        })
                      }
                    >
                      Hoàn tiền thành công
                    </button>
                    <button
                      className="button"
                      onClick={() =>
                        send({
                          type: "refund_status",
                          id: r.id,
                          status: "failed",
                          at: at(),
                        })
                      }
                    >
                      Hoàn tiền thất bại
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </section>
      <section className="panel slice-card">
        <h2>Kỳ đối soát mẫu</h2>
        <p>
          Ngày nghiệp vụ giờ Việt Nam; chỉ giao dịch capture/refund thành công.
          Tạo lại đúng ngày đã chốt sẽ tạo kỳ bổ sung chỉ cho giao dịch mới,
          không sửa kỳ cũ. Payment pending/failed/unknown không thành tiền đối
          soát.
        </p>
        {actor.role === "owner" && (
          <form
            className="slice-inline"
            onSubmit={(e) => {
              e.preventDefault();
              const start = new Date(`${date}T00:00:00+07:00`);
              send({
                type: "batch_create",
                id: `REC-${crypto.randomUUID()}`,
                siteId,
                start: start.toISOString(),
                end: new Date(start.getTime() + 86400000).toISOString(),
                scenario,
                at: at(),
              });
            }}
          >
            <label className="field">
              Điểm bán đối soát
              <select
                aria-label="Điểm bán đối soát"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              >
                {sites
                  .filter((s) =>
                    state.robots.some((r) => robotScope(r.id).siteId === s.id),
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Ngày đối soát
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="field">
              Dữ liệu sao kê mẫu
              <select
                aria-label="Dữ liệu sao kê mẫu"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as typeof scenario)}
              >
                <option value="missing">Thiếu giao dịch</option>
                <option value="mismatch">Lệch số tiền</option>
                <option value="duplicate">Trùng giao dịch</option>
                <option value="unreceived">Chưa xác nhận tiền</option>
                <option value="matched">Khớp đủ</option>
              </select>
            </label>
            <button className="button primary">Tạo kỳ đối soát mẫu</button>
          </form>
        )}
      </section>
      {p.batches.map((b) => (
        <BatchCard
          key={b.id}
          batch={b}
          state={state}
          actor={actor}
          send={send}
        />
      ))}
      <section className="panel slice-card">
        <h2>Lịch sử tài chính</h2>
        <ul className="history-list">
          {p.history
            .filter((h) => h.kind === "finance")
            .map((h) => (
              <li key={h.id}>
                {h.at} · {h.actor} · {h.entityId} · {h.from} → {h.to} · {h.note}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
