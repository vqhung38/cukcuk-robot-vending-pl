import { describe, expect, it } from "vitest";
import {
  canFinance,
  profiles,
  robotScope,
  scopedState,
  type Actor,
} from "./access";
import {
  aggregateFinance,
  batchTransactions,
  execute,
  financeMetrics,
  platformData,
  reconciliation,
  refundOutstanding,
  transactions,
  type PlatformCommand,
} from "./platform";
import { freshState, transition, type SalesState } from "./sales";
const manager = profiles[0],
  south = profiles[1],
  provider = profiles[2],
  owner = profiles[3];
const now = new Date();
const at = now.toISOString();
const start = new Date(now.getTime() - 3600000).toISOString(),
  end = new Date(now.getTime() + 3600000).toISOString();
function apply(s: SalesState, c: PlatformCommand, actor = manager) {
  const r = execute(s, c, actor);
  expect(r.error).toBeUndefined();
  return r.state;
}
function sale(s = freshState(), id = "O1", success = true, robotId = "RB-001") {
  s = apply(s, {
    type: "create",
    id,
    robotId,
    drinkId: "milk",
    quantity: 1,
    at,
  });
  s = apply(s, { type: "payment", id, success: true, at });
  s = apply(s, { type: "start", id, at });
  return apply(s, { type: "finish", id, cupId: `${id}-1`, success, at });
}
function batch(
  s: SalesState,
  scenario:
    | "matched"
    | "missing"
    | "mismatch"
    | "duplicate"
    | "unreceived" = "matched",
  id = "B1",
) {
  return apply(
    s,
    { type: "batch_create", id, siteId: "hcm-1", start, end, scenario, at },
    owner,
  );
}
function refund(s: SalesState, id = "R1") {
  s = apply(s, { type: "refund_request", id, orderId: "O1", at }, owner);
  return apply(
    s,
    { type: "refund_status", id, status: "processing", at },
    owner,
  );
}
function incident(s = freshState(), id = "I1") {
  return apply(s, {
    type: "incident",
    id,
    robotId: "RB-001",
    fault: "offline",
    message: "Mất kết nối",
    at,
  });
}
function assigned(s: SalesState, id = "I1") {
  s = apply(s, { type: "ticket_open", robotId: "RB-001", incidentId: id, at });
  return apply(s, {
    type: "ticket_assign",
    id: `T-${id}`,
    assignee: "ops-1",
    at,
  });
}
function progress(s: SalesState, id = "I1") {
  return apply(assigned(s, id), {
    type: "ticket_progress",
    id: `T-${id}`,
    progress: 50,
    note: "Kiểm tra nguồn",
    at,
  });
}
const resolve = (id = "I1"): PlatformCommand => ({
  type: "ticket_resolve",
  id: `T-${id}`,
  result: "Kết nối và pha thử đạt",
  verified: true,
  at,
});
describe("E2E-07 operations vertical slice", () => {
  it("opens an incident, blocks new sales and produces one alert for a replayed event", () => {
    const s = incident();
    expect(s.robots[0].status).toBe("offline");
    expect(s.incidents).toHaveLength(1);
    expect(incident(s)).toBe(s);
    expect(
      execute(
        s,
        {
          type: "create",
          id: "new",
          robotId: "RB-001",
          drinkId: "milk",
          quantity: 1,
          at,
        },
        manager,
      ).error,
    ).toBeTruthy();
  });
  it("supports assignment/progress/verified recovery with immutable status history and persisted result", () => {
    const s = progress(incident());
    const result = apply(s, resolve());
    expect(result.robots[0].status).toBe("online");
    expect(platformData(result).tickets[0]).toMatchObject({
      status: "resolved",
      progress: 100,
      assignee: "ops-1",
      result: "Kết nối và pha thử đạt",
    });
    expect(platformData(result).history).toHaveLength(5);
    expect(platformData(s).history).toHaveLength(4);
    expect(platformData(result).history.at(-1)).toMatchObject({
      actor: manager.id,
      from: "in_progress; robot=offline",
      to: "resolved; robot=online",
    });
    expect(apply(result, resolve())).toBe(result);
  });
  it("requires assignment, monotonic progress, notes, result and successful verification", () => {
    let s = apply(incident(), {
      type: "ticket_open",
      robotId: "RB-001",
      incidentId: "I1",
      at,
    });
    expect(
      execute(
        s,
        { type: "ticket_progress", id: "T-I1", progress: 50, note: "x", at },
        manager,
      ).error,
    ).toBeTruthy();
    s = progress(incident());
    for (const c of [
      { type: "ticket_progress", id: "T-I1", progress: 20, note: "x", at },
      { type: "ticket_progress", id: "T-I1", progress: 60, note: "", at },
      { ...resolve(), verified: false },
      { ...resolve(), result: "" },
    ] as PlatformCommand[])
      expect(execute(s, c, manager).error).toBeTruthy();
  });
  it("creates at most one ticket per incident and keeps robot blocked until all incidents resolve", () => {
    let s = incident(incident(), "I2");
    s = progress(s);
    s = apply(s, resolve());
    expect(s.robots[0].status).toBe("offline");
    const count = platformData(s).tickets.length;
    s = apply(s, {
      type: "ticket_open",
      incidentId: "I1",
      robotId: "RB-001",
      at,
    });
    expect(platformData(s).tickets).toHaveLength(count);
    s = progress(s, "I2");
    s = apply(s, resolve("I2"));
    expect(s.robots[0].status).toBe("online");
  });
  it("cannot restore while an order is brewing and does not alter payment/refund/stock history", () => {
    let s = apply(freshState(), {
      type: "create",
      id: "O1",
      robotId: "RB-001",
      drinkId: "milk",
      quantity: 1,
      at,
    });
    s = apply(s, { type: "payment", id: "O1", success: true, at });
    s = apply(s, { type: "start", id: "O1", at });
    s = progress(incident(s));
    expect(execute(s, resolve(), manager).error).toContain("đang pha");
    s = apply(s, {
      type: "finish",
      id: "O1",
      cupId: "O1-1",
      success: true,
      at,
    });
    const before = s.sales;
    const restored = apply(s, resolve());
    expect(restored.sales).toBe(before);
    expect(restored.robots[0].stock).toEqual(s.robots[0].stock);
  });
  it("links automatic brew failures to tickets and recovery leaves refund outstanding", () => {
    let s = sale(freshState(), "O1", false);
    const i = s.incidents[0];
    s = apply(s, {
      type: "ticket_open",
      incidentId: i.id,
      robotId: i.robotId,
      at,
    });
    s = apply(s, {
      type: "ticket_assign",
      id: `T-${i.id}`,
      assignee: "ops-2",
      at,
    });
    s = apply(s, {
      type: "ticket_progress",
      id: `T-${i.id}`,
      progress: 80,
      note: "Sửa cụm pha",
      at,
    });
    s = apply(s, {
      type: "ticket_resolve",
      id: `T-${i.id}`,
      result: "Test đạt",
      verified: true,
      at,
    });
    expect(s.robots[0].status).toBe("online");
    expect(s.sales[0].status).toBe("failed");
    expect(refundOutstanding(s, "O1")).toBe(35000);
  });
});
describe("E2E-04 payments/refunds/reconciliation vertical slice", () => {
  it("distinguishes order value, successful service, payment and settled money", () => {
    let s = apply(freshState(), {
      type: "create",
      id: "O1",
      robotId: "RB-001",
      drinkId: "milk",
      quantity: 1,
      at,
    });
    expect(financeMetrics(s, "Hôm nay", now)).toMatchObject({
      orderValue: 35000,
      revenue: 0,
      captured: 0,
      settled: 0,
    });
    s = apply(s, { type: "payment", id: "O1", success: true, at });
    expect(financeMetrics(s, "Hôm nay", now)).toMatchObject({
      orderValue: 35000,
      revenue: 0,
      captured: 35000,
      settled: 0,
    });
    expect(transactions(s)[0]).toMatchObject({
      id: "PAY-O1",
      orderId: "O1",
      amount: 35000,
      kind: "capture",
    });
  });
  it("unknown payment cannot brew or settle, resolves exactly once without a duplicate capture", () => {
    let s = apply(freshState(), {
      type: "create",
      id: "O1",
      robotId: "RB-001",
      drinkId: "milk",
      quantity: 1,
      at,
    });
    s = apply(s, { type: "payment_unknown", id: "O1", at });
    expect(
      execute(s, { type: "start", id: "O1", at }, manager).error,
    ).toBeTruthy();
    expect(transactions(s)).toHaveLength(0);
    s = apply(s, { type: "payment", id: "O1", success: true, at });
    s = apply(s, { type: "payment", id: "O1", success: true, at });
    expect(transactions(s)).toHaveLength(1);
  });
  it("refund processing/failed do not reduce cash; retry success reduces cash once without subtracting unrecognized revenue", () => {
    let s = refund(sale(freshState(), "O1", false));
    expect(financeMetrics(s, "Hôm nay", now).netCaptured).toBe(35000);
    s = apply(
      s,
      { type: "refund_status", id: "R1", status: "failed", at },
      owner,
    );
    expect(financeMetrics(s, "Hôm nay", now)).toMatchObject({
      revenue: 0,
      refunded: 0,
      netCaptured: 35000,
      outstandingRefund: 35000,
    });
    s = apply(
      s,
      { type: "refund_status", id: "R1", status: "processing", at },
      owner,
    );
    s = apply(
      s,
      { type: "refund_status", id: "R1", status: "succeeded", at },
      owner,
    );
    expect(financeMetrics(s, "Hôm nay", now)).toMatchObject({
      revenue: 0,
      refunded: 35000,
      netCaptured: 0,
      outstandingRefund: 0,
      settled: 0,
    });
    expect(transactions(s).map((t) => t.amount)).toEqual([35000, -35000]);
    expect(s.sales[0].refund).toBe("refunded");
    expect(
      apply(
        s,
        { type: "refund_status", id: "R1", status: "succeeded", at },
        owner,
      ),
    ).toBe(s);
    expect(
      execute(s, { type: "refund_request", id: "R2", orderId: "O1", at }, owner)
        .error,
    ).toBeTruthy();
  });
  it("refunds only failed cups across successive partial failures without double-counting good service", () => {
    let s = apply(freshState(), {
      type: "create",
      id: "O1",
      robotId: "RB-001",
      drinkId: "milk",
      quantity: 3,
      at,
    });
    s = apply(s, { type: "payment", id: "O1", success: true, at });
    s = apply(s, { type: "start", id: "O1", at });
    s = apply(s, {
      type: "finish",
      id: "O1",
      cupId: "O1-1",
      success: false,
      at,
    });
    s = refund(s);
    s = apply(
      s,
      { type: "refund_status", id: "R1", status: "succeeded", at },
      owner,
    );
    s = apply(s, {
      type: "finish",
      id: "O1",
      cupId: "O1-2",
      success: false,
      at,
    });
    s = apply(s, {
      type: "finish",
      id: "O1",
      cupId: "O1-3",
      success: true,
      at,
    });
    expect(refundOutstanding(s, "O1")).toBe(35000);
    s = refund(s, "R2");
    s = apply(
      s,
      { type: "refund_status", id: "R2", status: "succeeded", at },
      owner,
    );
    expect(financeMetrics(s, "Hôm nay", now)).toMatchObject({
      revenue: 35000,
      captured: 105000,
      refunded: 70000,
      netCaptured: 35000,
      outstandingRefund: 0,
    });
    expect(s.sales[0].status).toBe("partially_fulfilled");
    s = batch(s);
    s = apply(s, { type: "batch_close", id: "B1", at }, owner);
    for (const by of ["robot", "site", "chain"] as const)
      expect(
        aggregateFinance(s, by, "Hôm nay").reduce(
          (sum, row) => sum + row.settled,
          0,
        ),
      ).toBe(35000);
  });
  it("prevents duplicate refund requests, skipping processing and refunding good cups", () => {
    expect(
      execute(
        sale(),
        { type: "refund_request", id: "R1", orderId: "O1", at },
        owner,
      ).error,
    ).toBeTruthy();
    let s = sale(freshState(), "O1", false);
    s = apply(
      s,
      { type: "refund_request", id: "R1", orderId: "O1", at },
      owner,
    );
    expect(
      execute(s, { type: "refund_request", id: "R2", orderId: "O1", at }, owner)
        .error,
    ).toBeTruthy();
    expect(
      execute(
        s,
        { type: "refund_status", id: "R1", status: "succeeded", at },
        owner,
      ).error,
    ).toBeTruthy();
  });
  it.each(["missing", "mismatch", "duplicate", "unreceived"] as const)(
    "identifies %s and blocks posting until corrected with a reason",
    (scenario) => {
      let s = batch(sale(), scenario);
      const b = platformData(s).batches[0];
      expect(reconciliation(s, b)[0].status).toBe(scenario);
      expect(financeMetrics(s, "Hôm nay", now).settled).toBe(0);
      expect(
        execute(s, { type: "batch_close", id: "B1", at }, owner).error,
      ).toBeTruthy();
      expect(
        execute(
          s,
          {
            type: "statement_set",
            id: "B1",
            transactionId: "PAY-O1",
            amount: 35000,
            received: true,
            note: "",
            at,
          },
          owner,
        ).error,
      ).toBeTruthy();
      s = apply(
        s,
        {
          type: "statement_set",
          id: "B1",
          transactionId: "PAY-O1",
          amount: 35000,
          received: true,
          note: "Sao kê mẫu đã xác minh",
          at,
        },
        owner,
      );
      s = apply(s, { type: "batch_close", id: "B1", at }, owner);
      expect(financeMetrics(s, "Hôm nay", now).settled).toBe(35000);
      expect(s.sales[0].total).toBe(35000);
      expect(apply(s, { type: "batch_close", id: "B1", at }, owner)).toBe(s);
      expect(
        execute(
          s,
          {
            type: "statement_set",
            id: "B1",
            transactionId: "PAY-O1",
            amount: 0,
            received: true,
            note: "x",
            at,
          },
          owner,
        ).error,
      ).toBeTruthy();
    },
  );
  it("matched statement does not post money until explicitly closed", () => {
    const s = batch(sale());
    expect(reconciliation(s, platformData(s).batches[0])[0].status).toBe(
      "matched",
    );
    expect(financeMetrics(s, "Hôm nay", now).settled).toBe(0);
  });
  it("rejects overlapping or empty periods and wrong site; excludes unsuccessful payments", () => {
    let s = batch(sale());
    expect(
      execute(
        s,
        {
          type: "batch_create",
          id: "B2",
          siteId: "hcm-1",
          start,
          end,
          scenario: "matched",
          at,
        },
        owner,
      ).error,
    ).toBeTruthy();
    expect(
      execute(
        s,
        {
          type: "batch_create",
          id: "B2",
          siteId: "dn",
          start,
          end,
          scenario: "matched",
          at,
        },
        owner,
      ).error,
    ).toBeTruthy();
    s = apply(freshState(), {
      type: "create",
      id: "O1",
      robotId: "RB-001",
      drinkId: "milk",
      quantity: 1,
      at,
    });
    s = apply(s, { type: "payment", id: "O1", success: false, at });
    expect(
      execute(
        s,
        {
          type: "batch_create",
          id: "B2",
          siteId: "hcm-1",
          start,
          end,
          scenario: "matched",
          at,
        },
        owner,
      ).error,
    ).toBeTruthy();
  });
  it("new transactions invalidate a review batch; late transactions after posting use an immutable supplemental batch", () => {
    let s = batch(sale());
    s = sale(s, "O2");
    expect(
      reconciliation(s, platformData(s).batches[0]).find(
        (i) => i.transactionId === "PAY-O2",
      )?.status,
    ).toBe("missing");
    s = apply(
      s,
      {
        type: "statement_set",
        id: "B1",
        transactionId: "PAY-O2",
        amount: 35000,
        received: true,
        note: "Mới đến",
        at,
      },
      owner,
    );
    s = apply(s, { type: "batch_close", id: "B1", at }, owner);
    const frozen = structuredClone(platformData(s).batches[0]);
    s = sale(s, "O3");
    s = batch(s, "matched", "B2");
    expect(platformData(s).batches[1].adjustmentOf).toBe("B1");
    expect(
      batchTransactions(s, platformData(s).batches[1]).map((t) => t.orderId),
    ).toEqual(["O3"]);
    s = apply(s, { type: "batch_close", id: "B2", at }, owner);
    expect(platformData(s).batches[0]).toEqual(frozen);
    expect(financeMetrics(s, "Hôm nay", now).settled).toBe(105000);
  });
  it("refund posted after capture close needs its own signed supplemental reconciliation", () => {
    let s = sale(freshState(), "O1", false);
    s = batch(s);
    s = apply(s, { type: "batch_close", id: "B1", at }, owner);
    s = refund(s);
    s = apply(
      s,
      { type: "refund_status", id: "R1", status: "succeeded", at },
      owner,
    );
    expect(financeMetrics(s, "Hôm nay", now)).toMatchObject({
      settled: 35000,
      netCaptured: 0,
    });
    s = batch(s, "matched", "B2");
    s = apply(s, { type: "batch_close", id: "B2", at }, owner);
    expect(financeMetrics(s, "Hôm nay", now).settled).toBe(0);
  });
  it("robot, site and chain grouping preserve totals, including two robots at one site", () => {
    let s = sale();
    s = sale(s, "O2", true, "RB-002");
    s = sale(s, "O3", true, "RB-005");
    s = batch(s);
    s = apply(s, { type: "batch_close", id: "B1", at }, owner);
    const total = financeMetrics(s, "Hôm nay", now);
    for (const group of ["robot", "site", "chain"] as const) {
      const rows = aggregateFinance(s, group, "Hôm nay");
      for (const field of [
        "orderValue",
        "revenue",
        "captured",
        "refunded",
        "settled",
      ] as const)
        expect(rows.reduce((sum, row) => sum + row[field], 0)).toBe(
          total[field],
        );
    }
    expect(
      aggregateFinance(s, "site", "Hôm nay").find((r) => r.id === "hcm-1")
        ?.revenue,
    ).toBe(70000);
  });
});
describe("Role and scope boundaries", () => {
  it("projects manager chains and rejects direct commands for hidden robot/order/ticket IDs", () => {
    let s = sale(freshState(), "NORTH", true, "RB-005");
    s = apply(s, {
      type: "incident",
      id: "IN",
      robotId: "RB-005",
      fault: "error",
      message: "x",
      at,
    });
    const view = scopedState(s, south);
    expect(view.robots.some((r) => r.id === "RB-005")).toBe(false);
    expect(view.sales).toHaveLength(0);
    expect(view.incidents).toHaveLength(0);
    for (const command of [
      { type: "refill", robotId: "RB-005", index: 0, amount: 5 },
      { type: "payment", id: "NORTH", success: true, at },
      { type: "ticket_open", incidentId: "IN", robotId: "RB-005", at },
    ] as PlatformCommand[])
      expect(execute(s, command, south).state).toBe(s);
  });
  it("provider sees operations without financial values and cannot access financial mutations", () => {
    const s = sale();
    const view = scopedState(s, provider);
    expect(canFinance(provider)).toBe(false);
    expect(view.sales).toHaveLength(0);
    expect(view.robots.every((r) => r.revenue === 0 && r.orders === 0)).toBe(
      true,
    );
    expect(
      platformData(view).history.every((h) => h.kind === "operation"),
    ).toBe(true);
    expect(
      execute(
        s,
        {
          type: "batch_create",
          id: "B",
          siteId: "hcm-1",
          start,
          end,
          scenario: "matched",
          at,
        },
        provider,
      ).error,
    ).toBeTruthy();
  });
  it("owner reads organization finances but cannot mutate robot operations or customer outcomes", () => {
    const s = incident();
    expect(
      execute(
        s,
        { type: "ticket_open", incidentId: "I1", robotId: "RB-001", at },
        owner,
      ).error,
    ).toBeTruthy();
    expect(
      execute(
        s,
        { type: "refill", robotId: "RB-001", index: 0, amount: 5 },
        owner,
      ).error,
    ).toBeTruthy();
    expect(
      execute(sale(), { type: "payment", id: "O1", success: true, at }, owner)
        .error,
    ).toBeTruthy();
  });
  it("unknown tenant cannot read data or create batches, even with owner role", () => {
    const outsider: Actor = { ...owner, tenantId: "other" };
    const s = batch(sale());
    const v = scopedState(s, outsider);
    expect(v.robots).toHaveLength(0);
    expect(v.sales).toHaveLength(0);
    expect(platformData(v).batches).toHaveLength(0);
    expect(
      execute(s, { type: "batch_close", id: "B1", at }, outsider).error,
    ).toBeTruthy();
    expect(robotScope("unknown").tenantId).toBe("unknown");
  });
});
