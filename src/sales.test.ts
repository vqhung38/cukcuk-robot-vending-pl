import { describe, expect, it } from "vitest";
import {
  availableStock,
  drinks,
  freshState,
  inPeriod,
  salesMetrics,
  transition,
  type Command,
  type SalesState,
} from "./sales";
const at = "2026-10-31T03:00:00.000Z";
const now = new Date(at);
const create = (
  id = "order-1",
  quantity = 1,
  robotId = "RB-001",
  drinkId = "milk",
): Command => ({ type: "create", id, quantity, robotId, drinkId, at });
function apply(s: SalesState, c: Command) {
  const result = transition(s, c);
  expect(result.error).toBeUndefined();
  return result.state;
}
function paid(quantity = 1) {
  return apply(apply(freshState(), create("order-1", quantity)), {
    type: "payment",
    id: "order-1",
    success: true,
    at,
  });
}
function brewing(quantity = 1) {
  return apply(paid(quantity), { type: "start", id: "order-1", at });
}
const finish = (success = true, cupId = "order-1-1"): Command => ({
  type: "finish",
  id: "order-1",
  cupId,
  success,
  at,
});
describe("E2E-02 / BR03–10: sales transitions and inventory", () => {
  it.each(["RB-006", "RB-004", "unknown"])(
    "rejects offline/error/unknown robot %s",
    (robotId) => {
      const state = freshState();
      const result = transition(state, create("x", 1, robotId));
      expect(result.error).toBeTruthy();
      expect(result.state).toBe(state);
      expect(state.sales).toHaveLength(0);
    },
  );
  it.each([0, -1, 1.5, 21, NaN, Infinity])(
    "rejects invalid quantity %s",
    (n) => {
      const state = freshState();
      expect(transition(state, create("x", n)).state).toBe(state);
      expect(transition(state, create("x", n)).error).toBeTruthy();
    },
  );
  it("rejects invalid drink without side effects", () => {
    const state = freshState();
    expect(
      transition(state, create("x", 1, "RB-001", "fake")).error,
    ).toBeTruthy();
  });
  it("blocks insufficient milk and accepts exactly enough stock", () => {
    let s = freshState();
    s.robots[0].stock = [4, 6, 2, 2];
    expect(transition(s, create("too-many", 3)).error).toContain("Không đủ");
    s = apply(s, create("exact", 2));
    expect(availableStock(s, "RB-001")).toEqual([0, 0, 0, 0]);
    expect(s.robots[0].stock).toEqual([4, 6, 2, 2]);
  });
  it("reserves all open cups atomically and prevents overselling across orders", () => {
    let s = freshState();
    s.robots[0].stock = [4, 6, 2, 2];
    s = apply(s, create());
    s = apply(s, create("order-2"));
    expect(transition(s, create("order-3")).error).toContain("Không đủ");
  });
  it("duplicate create does not reserve twice and snapshots recipe/price", () => {
    const s = apply(freshState(), create());
    const duplicate = apply(s, create());
    expect(duplicate).toBe(s);
    expect(s.sales).toHaveLength(1);
    expect(s.sales[0].bom).toEqual(drinks[1].bom);
    expect(s.sales[0].bom).not.toBe(drinks[1].bom);
    expect(s.sales[0].total).toBe(35000);
  });
  it("payment failure releases stock, has no revenue/capture and cannot brew", () => {
    let s = apply(freshState(), create());
    s = apply(s, { type: "payment", id: "order-1", success: false, at });
    expect(availableStock(s, "RB-001")).toEqual(s.robots[0].stock);
    expect(salesMetrics(s.sales, "Hôm nay", now)).toEqual({
      revenue: 0,
      completedOrders: 0,
      cups: 0,
      captured: 0,
      refundRequired: 0,
    });
    expect(
      transition(s, { type: "start", id: "order-1", at }).error,
    ).toBeTruthy();
    expect(
      transition(s, { type: "payment", id: "order-1", success: true, at })
        .error,
    ).toBeTruthy();
  });
  it("pending cannot start or finish; paid cannot finish before start", () => {
    const pending = apply(freshState(), create());
    expect(
      transition(pending, { type: "start", id: "order-1", at }).error,
    ).toBeTruthy();
    expect(transition(pending, finish()).error).toBeTruthy();
    expect(transition(paid(), finish()).error).toBeTruthy();
  });
  it("duplicate payment/start do not change capture, reservation or stock", () => {
    let s = paid();
    expect(salesMetrics(s.sales, "Hôm nay", now).revenue).toBe(0);
    s = apply(s, { type: "payment", id: "order-1", success: true, at });
    s = apply(s, { type: "start", id: "order-1", at });
    expect(apply(s, { type: "start", id: "order-1", at })).toBe(s);
    expect(salesMetrics(s.sales, "Hôm nay", now).captured).toBe(35000);
    expect(s.robots[0].stock).toEqual(freshState().robots[0].stock);
  });
  it("finishes successfully exactly once with consumption and report updates", () => {
    const base = brewing(2);
    let s = apply(base, finish());
    s = apply(s, finish(true, "order-1-2"));
    expect(s.sales[0].status).toBe("completed");
    expect(s.robots[0].stock).toEqual([74, 59, 80, 88]);
    expect(salesMetrics(s.sales, "Hôm nay", now)).toEqual({
      revenue: 70000,
      completedOrders: 1,
      cups: 2,
      captured: 70000,
      refundRequired: 0,
    });
    expect(apply(s, finish())).toBe(s);
    expect(apply(s, finish(false))).toBe(s);
    expect(base.robots[0].stock).toEqual([78, 65, 82, 90]); // no input mutation
  });
  it("records failure and refund requirement once without successful revenue/consumption", () => {
    const base = brewing();
    const s = apply(base, finish(false));
    expect(s.sales[0]).toMatchObject({
      status: "failed",
      refund: "required",
      refundAmount: 35000,
      payment: "succeeded",
    });
    expect(s.robots[0].stock).toEqual(base.robots[0].stock);
    expect(s.robots[0].status).toBe("error");
    expect(s.incidents).toHaveLength(1);
    expect(apply(s, finish(false))).toBe(s);
    expect(salesMetrics(s.sales, "Hôm nay", now)).toEqual({
      revenue: 0,
      completedOrders: 0,
      cups: 0,
      captured: 35000,
      refundRequired: 35000,
    });
  });
  it("preserves good cups in a three-cup order when cup two fails", () => {
    let s = brewing(3);
    s = apply(s, finish());
    s = apply(s, finish(false, "order-1-2"));
    s = apply(s, finish(true, "order-1-3"));
    expect(s.sales[0].status).toBe("partially_fulfilled");
    expect(s.sales[0].refundAmount).toBe(35000);
    expect(s.robots[0].stock).toEqual([74, 59, 80, 88]);
    expect(availableStock(s, "RB-001")).toEqual(s.robots[0].stock);
    expect(salesMetrics(s.sales, "Hôm nay", now)).toEqual({
      revenue: 70000,
      completedOrders: 0,
      cups: 2,
      captured: 105000,
      refundRequired: 35000,
    });
    expect(transition(s, create("new")).error).toContain("không hoạt động");
  });
  it("checks robot health again before starting paid orders and serializes brewing orders", () => {
    let s = paid();
    s.robots[0].status = "offline";
    expect(
      transition(s, { type: "start", id: "order-1", at }).error,
    ).toBeTruthy();
    s = brewing();
    s = apply(s, create("second"));
    s = apply(s, { type: "payment", id: "second", success: true, at });
    expect(transition(s, { type: "start", id: "second", at }).error).toContain(
      "đơn khác",
    );
  });
  it("refills physical stock without losing reservations", () => {
    let s = apply(freshState(), create());
    s = apply(s, { type: "refill", robotId: "RB-001", index: 1, amount: 10 });
    expect(s.robots[0].stock[1]).toBe(75);
    expect(availableStock(s, "RB-001")[1]).toBe(72);
    expect(
      transition(s, { type: "refill", robotId: "RB-001", index: 4, amount: -1 })
        .error,
    ).toBeTruthy();
  });
  it("rejects unknown orders/cups", () => {
    expect(transition(freshState(), finish()).error).toBeTruthy();
    expect(transition(brewing(), finish(true, "fake")).error).toBeTruthy();
  });
  it("includes new sales once in 1/7/30-day periods, using Vietnam midnight boundaries", () => {
    const s = apply(brewing(), finish());
    for (const period of ["Hôm nay", "7 ngày qua", "30 ngày qua"])
      expect(salesMetrics(s.sales, period, now).revenue).toBe(35000);
    expect(inPeriod("2026-10-30T17:00:00Z", "Hôm nay", now)).toBe(true);
    expect(inPeriod("2026-10-31T17:00:00Z", "Hôm nay", now)).toBe(false);
    expect(inPeriod("2026-10-30T16:59:59Z", "Hôm nay", now)).toBe(false);
    expect(
      salesMetrics(s.sales, "Hôm nay", new Date("2026-11-01T03:00:00Z"))
        .revenue,
    ).toBe(0);
  });
});
