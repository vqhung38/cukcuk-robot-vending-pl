import type { PlatformCommand } from "../platform";
import { useState } from "react";
import { ingredients, money, statusLabel } from "../data";
import {
  availableStock,
  cupLabels,
  drinks,
  orderLabels,
  purchaseError,
  type Sale,
  type SalesState,
} from "../sales";

export function SaleDetail({
  order,
  send,
  canSimulate = true,
  refundRemaining,
}: {
  order: Sale;
  send: (c: PlatformCommand) => void;
  canSimulate?: boolean;
  refundRemaining?: number;
}) {
  const at = () => new Date().toISOString();
  return (
    <section className="panel sale-detail" aria-label={`Đơn ${order.id}`}>
      <div className="sale-heading">
        <div>
          <h2>{order.id}</h2>
          <p>
            {order.robotName} · {order.drink} × {order.quantity}
          </p>
        </div>
        <strong>{money(order.total)}</strong>
      </div>
      <p role="status">
        <strong>{orderLabels[order.status]}</strong>
      </p>
      <p>
        Thanh toán:{" "}
        {order.payment === "succeeded"
          ? "Thành công (giả lập)"
          : order.payment === "failed"
            ? "Thất bại"
            : order.payment === "unknown"
              ? "Chưa xác định · cần xác minh"
              : "Chờ kết quả"}
      </p>
      {order.refund === "required" && (
        <p className="purchase-warning" role="alert">
          Cần xử lý hoàn tiền: {money(refundRemaining ?? order.refundAmount)}.
          Chưa hoàn tiền.
        </p>
      )}
      {order.refund === "refunded" && <p>Đã hoàn tiền thành công (giả lập).</p>}
      <p>Mã thanh toán: {order.paymentId ?? `PAY-${order.id}`}</p>
      <div className="sale-actions">
        {canSimulate &&
          (order.payment === "pending" || order.payment === "unknown") && (
            <>
              {order.payment === "pending" && (
                <button
                  className="button"
                  onClick={() =>
                    send({ type: "payment_unknown", id: order.id, at: at() })
                  }
                >
                  Thanh toán chưa xác định
                </button>
              )}
              <button
                className="button primary"
                onClick={() =>
                  send({
                    type: "payment",
                    id: order.id,
                    success: true,
                    at: at(),
                  })
                }
              >
                Thanh toán thành công
              </button>
              <button
                className="button"
                onClick={() =>
                  send({
                    type: "payment",
                    id: order.id,
                    success: false,
                    at: at(),
                  })
                }
              >
                Thanh toán thất bại
              </button>
            </>
          )}
        {canSimulate && order.status === "paid" && (
          <button
            className="button primary"
            onClick={() => send({ type: "start", id: order.id, at: at() })}
          >
            Bắt đầu pha chế
          </button>
        )}
      </div>
      <ol className="cup-list">
        {order.cups.map((cup, i) => (
          <li key={cup.id}>
            <span>
              Ly {i + 1}/{order.quantity} · {cupLabels[cup.status]}
            </span>
            {canSimulate && cup.status === "brewing" && (
              <div className="sale-actions">
                <button
                  className="button"
                  onClick={() =>
                    send({
                      type: "finish",
                      id: order.id,
                      cupId: cup.id,
                      success: true,
                      at: at(),
                    })
                  }
                >
                  Ly {i + 1} pha thành công
                </button>
                <button
                  className="button"
                  onClick={() =>
                    send({
                      type: "finish",
                      id: order.id,
                      cupId: cup.id,
                      success: false,
                      at: at(),
                    })
                  }
                >
                  Ly {i + 1} pha thất bại
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
export function CustomerShop({
  state,
  send,
}: {
  state: SalesState;
  send: (c: PlatformCommand) => void;
}) {
  const [robotId, setRobotId] = useState(
    state.robots.find((r) => r.status === "online")?.id || "",
  );
  const [drinkId, setDrinkId] = useState(drinks[0].id);
  const [quantity, setQuantity] = useState(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const robot = state.robots.find((r) => r.id === robotId);
  const drink = drinks.find((d) => d.id === drinkId)!;
  const error = purchaseError(state, robotId, drinkId, quantity);
  const available = availableStock(state, robotId);
  const order = state.sales.find((o) => o.id === orderId);
  return (
    <div className="shop-layout">
      <section className="panel shop-form">
        <h2>Chọn cà phê của bạn</h2>
        <p>Chỉ mô phỏng, không thu tiền hoặc điều khiển robot thật.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (error) return;
            const id = `DEMO-${crypto.randomUUID()}`;
            send({
              type: "create",
              id,
              robotId,
              drinkId,
              quantity,
              at: new Date().toISOString(),
            });
            setOrderId(id);
          }}
        >
          <label className="field">
            Robot nhận đơn
            <select
              aria-label="Robot nhận đơn"
              value={robotId}
              onChange={(e) => setRobotId(e.target.value)}
            >
              {state.robots.map((r) => (
                <option
                  key={r.id}
                  value={r.id}
                  disabled={r.status !== "online"}
                >
                  {r.id} · {r.name} · {statusLabel[r.status]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Đồ uống
            <select
              aria-label="Đồ uống"
              value={drinkId}
              onChange={(e) => setDrinkId(e.target.value)}
            >
              {drinks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {money(d.price)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Số lượng
            <input
              type="number"
              min="1"
              max="20"
              step="1"
              required
              value={Number.isNaN(quantity) ? "" : quantity}
              onChange={(e) => setQuantity(e.target.valueAsNumber)}
            />
          </label>
          <p className="shop-total">
            Tổng tiền{" "}
            <strong>
              {money(drink.price * (Number.isFinite(quantity) ? quantity : 0))}
            </strong>
          </p>
          {error && (
            <p className="purchase-warning" role="alert">
              {error}
            </p>
          )}
          <button
            className="button primary"
            disabled={
              !!error ||
              (!!order &&
                ["awaiting_payment", "paid", "brewing"].includes(order.status))
            }
          >
            Tạo đơn hàng
          </button>
          {order &&
            ["awaiting_payment", "paid", "brewing"].includes(order.status) && (
              <p>
                Hãy xử lý đơn hiện tại trước khi tạo đơn tiếp theo trên trang
                này.
              </p>
            )}
        </form>
        <h3>Nguyên liệu tại {robot?.name}</h3>
        <p>Đơn vị demo: % sức chứa. Khả dụng = tồn thực − giữ chỗ.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nguyên liệu</th>
                <th>Tồn thực</th>
                <th>Khả dụng</th>
                <th>Cần cho đơn</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((name, i) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{robot?.stock[i] ?? 0}%</td>
                  <td>{available[i]}%</td>
                  <td>
                    {drink.bom[i] * (Number.isFinite(quantity) ? quantity : 0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {order ? (
        <SaleDetail order={order} send={send} />
      ) : (
        <section className="panel shop-empty">
          <h2>Từ hạt cà phê đến ly của bạn</h2>
          <p>
            Chọn robot, đồ uống và số lượng. Sau khi tạo đơn, bạn có thể mô
            phỏng kết quả thanh toán và từng ly pha chế.
          </p>
          <p>
            Đơn đang xử lý có thể tiếp tục tại mục Đơn hàng, kể cả sau khi tải
            lại trang.
          </p>
        </section>
      )}
    </div>
  );
}
