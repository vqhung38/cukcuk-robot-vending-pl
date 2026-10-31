import {
  canFinance,
  canOperate,
  canView,
  robotScope,
  saleScope,
  type Actor,
  type Scope,
} from "./access";
import {
  inPeriod,
  salesMetrics,
  transition,
  type Command,
  type SalesState,
} from "./sales";
import type {
  Batch,
  History,
  PlatformData,
  StatementLine,
  Transaction,
} from "./platformTypes";
export type PlatformCommand =
  | Command
  | {
      type: "incident";
      id: string;
      robotId: string;
      fault: "offline" | "error";
      message: string;
      at: string;
    }
  | { type: "ticket_open"; incidentId: string; robotId: string; at: string }
  | { type: "ticket_assign"; id: string; assignee: string; at: string }
  | {
      type: "ticket_progress";
      id: string;
      progress: number;
      note: string;
      at: string;
    }
  | {
      type: "ticket_resolve";
      id: string;
      result: string;
      verified: boolean;
      at: string;
    }
  | { type: "payment_unknown"; id: string; at: string }
  | { type: "refund_request"; id: string; orderId: string; at: string }
  | {
      type: "refund_status";
      id: string;
      status: "processing" | "succeeded" | "failed";
      at: string;
    }
  | {
      type: "batch_create";
      id: string;
      siteId: string;
      start: string;
      end: string;
      scenario: "matched" | "missing" | "mismatch" | "duplicate" | "unreceived";
      at: string;
    }
  | {
      type: "statement_set";
      id: string;
      transactionId: string;
      amount: number;
      received: boolean;
      note: string;
      at: string;
    }
  | { type: "batch_close"; id: string; at: string };
export const platformData = (s: SalesState): PlatformData =>
  s.platform ?? { tickets: [], history: [], refunds: [], batches: [] };
export function transactions(s: SalesState): Transaction[] {
  return [
    ...s.sales
      .filter((o) => o.payment === "succeeded" && o.paidAt)
      .map((o) => ({
        id: o.paymentId ?? `PAY-${o.id}`,
        orderId: o.id,
        robotId: o.robotId,
        scope: saleScope(o),
        kind: "capture" as const,
        amount: o.total,
        at: o.paidAt!,
      })),
    ...platformData(s)
      .refunds.filter((r) => r.status === "succeeded" && r.finishedAt)
      .flatMap((r) => {
        const o = s.sales.find((o) => o.id === r.orderId);
        return o
          ? [
              {
                id: r.id,
                orderId: o.id,
                robotId: o.robotId,
                scope: saleScope(o),
                kind: "refund" as const,
                amount: -r.amount,
                at: r.finishedAt!,
              },
            ]
          : [];
      }),
  ];
}
export function batchTransactions(s: SalesState, b: Batch) {
  const posted = new Set(
    platformData(s)
      .batches.filter((v) => v.status === "closed" && v.id !== b.id)
      .flatMap((v) => v.transactions.map((t) => t.id)),
  );
  return b.status === "closed"
    ? b.transactions
    : transactions(s).filter(
        (t) =>
          !posted.has(t.id) &&
          t.scope.siteId === b.scope.siteId &&
          t.scope.tenantId === b.scope.tenantId &&
          t.at >= b.start &&
          t.at < b.end,
      );
}
export function reconciliation(s: SalesState, b: Batch) {
  const txs = batchTransactions(s, b);
  const items = txs.map((t) => {
    const lines = b.lines.filter((l) => l.transactionId === t.id);
    const status = !lines.length
      ? "missing"
      : lines.length > 1
        ? "duplicate"
        : lines[0].amount !== t.amount
          ? "mismatch"
          : !lines[0].received
            ? "unreceived"
            : "matched";
    return {
      transactionId: t.id,
      expected: t.amount,
      actual: lines.reduce((sum, l) => sum + l.amount, 0),
      status,
    };
  });
  const extra = b.lines
    .filter((l) => !txs.some((t) => t.id === l.transactionId))
    .map((l) => ({
      transactionId: l.transactionId,
      expected: 0,
      actual: l.amount,
      status: "unknown",
    }));
  return [...items, ...extra];
}
export function refundOutstanding(s: SalesState, orderId: string) {
  const o = s.sales.find((o) => o.id === orderId);
  if (!o) return 0;
  return (
    o.refundAmount -
    platformData(s)
      .refunds.filter((r) => r.orderId === orderId && r.status === "succeeded")
      .reduce((sum, r) => sum + r.amount, 0)
  );
}
export function financeMetrics(
  s: SalesState,
  period: string,
  now = new Date(),
) {
  const metrics = salesMetrics(s.sales, period, now);
  const txs = transactions(s).filter((t) => inPeriod(t.at, period, now));
  const settled = platformData(s)
    .batches.filter((b) => b.status === "closed")
    .flatMap((b) => b.transactions)
    .filter((t) => inPeriod(t.at, period, now));
  return {
    ...metrics,
    orderValue: s.sales
      .filter((o) => inPeriod(o.createdAt, period, now))
      .reduce((sum, o) => sum + o.total, 0),
    refunded: txs
      .filter((t) => t.kind === "refund")
      .reduce((sum, t) => sum - t.amount, 0),
    netCaptured: txs.reduce((sum, t) => sum + t.amount, 0),
    settled: settled.reduce((sum, t) => sum + t.amount, 0),
    // An outstanding balance at viewing time, independent of the original order date.
    outstandingRefund: s.sales.reduce(
      (sum, o) => sum + refundOutstanding(s, o.id),
      0,
    ),
  };
}
export function aggregateFinance(
  s: SalesState,
  by: "robot" | "site" | "chain",
  period: string,
) {
  const groups = new Map<string, SalesState>();
  // Include robots with no transactions; group sales by their historical scope, never a label.
  for (const r of s.robots) {
    const scope = robotScope(r.id);
    const id =
      by === "robot" ? r.id : by === "site" ? scope.siteId : scope.chainId;
    if (!groups.has(id)) groups.set(id, { ...s, robots: [], sales: [] });
    groups.get(id)!.robots.push(r);
  }
  for (const o of s.sales) {
    const scope = saleScope(o);
    const id =
      by === "robot" ? o.robotId : by === "site" ? scope.siteId : scope.chainId;
    if (!groups.has(id)) groups.set(id, { ...s, robots: [], sales: [] });
    groups.get(id)!.sales.push(o);
  }
  return [...groups].map(([id, g]) => {
    const orderIds = new Set(g.sales.map((o) => o.id));
    const pd = platformData(s);
    g.platform = {
      ...pd,
      refunds: pd.refunds.filter((r) => orderIds.has(r.orderId)),
      batches: pd.batches.map((b) => ({
        ...b,
        transactions: b.transactions.filter((t) => orderIds.has(t.orderId)),
      })),
    };
    return { id, ...financeMetrics(g, period) };
  });
}
export function execute(
  s: SalesState,
  c: PlatformCommand,
  actor: Actor,
): { state: SalesState; error?: string } {
  const reject = (error: string) => ({ state: s, error });
  const p = platformData(s);
  const checkRobot = (id: string) =>
    s.robots.some((r) => r.id === id) && canView(actor, robotScope(id));
  const checkOrder = (id: string) =>
    s.sales.some((o) => o.id === id && canView(actor, saleScope(o)));
  const audit = (
    robotId: string,
    entityId: string,
    kind: History["kind"],
    from: string,
    to: string,
    note: string,
    at: string,
  ): History => ({
    id: `H-${p.history.length + 1}`,
    robotId,
    entityId,
    kind,
    from,
    to,
    note,
    at,
    actor: actor.id,
  });
  const save = (
    data: Partial<PlatformData>,
    history: History,
    robots = s.robots,
    sales = s.sales,
    incidents = s.incidents,
  ) => ({
    state: {
      ...s,
      robots,
      sales,
      incidents,
      platform: { ...p, ...data, history: [...p.history, history] },
    },
  });
  if (c.type === "incident") {
    if (!canOperate(actor) || !checkRobot(c.robotId))
      return reject("Không có quyền vận hành robot này.");
    if (s.incidents.some((i) => i.id === c.id)) return { state: s };
    if (!c.message.trim()) return reject("Cần mô tả sự cố.");
    const old = s.robots.find((r) => r.id === c.robotId)!;
    return save(
      {},
      audit(c.robotId, c.id, "operation", old.status, c.fault, c.message, c.at),
      s.robots.map((r) => (r.id === c.robotId ? { ...r, status: c.fault } : r)),
      s.sales,
      [
        ...s.incidents,
        {
          id: c.id,
          robotId: c.robotId,
          orderId: "",
          cupId: "",
          createdAt: c.at,
          message: c.message.trim(),
        },
      ],
    );
  }
  if (c.type === "ticket_open") {
    if (!canOperate(actor) || !checkRobot(c.robotId))
      return reject("Không có quyền mở phiếu.");
    if (p.tickets.some((t) => t.incidentId === c.incidentId))
      return { state: s };
    const incident = s.incidents.find(
      (i) => i.id === c.incidentId && i.robotId === c.robotId,
    );
    if (!incident) return reject("Không tìm thấy sự cố.");
    const ticket = {
      id: `T-${incident.id}`,
      incidentId: incident.id,
      robotId: incident.robotId,
      status: "open" as const,
      progress: 0,
    };
    return save(
      { tickets: [...p.tickets, ticket] },
      audit(
        ticket.robotId,
        ticket.id,
        "operation",
        "alert",
        "open",
        "Mở phiếu xử lý",
        c.at,
      ),
    );
  }
  if (
    c.type === "ticket_assign" ||
    c.type === "ticket_progress" ||
    c.type === "ticket_resolve"
  ) {
    const t = p.tickets.find((t) => t.id === c.id);
    if (!t || !canOperate(actor) || !checkRobot(t.robotId))
      return reject("Không có quyền xử lý phiếu này.");
    if (t.status === "resolved")
      return c.type === "ticket_resolve"
        ? { state: s }
        : reject("Phiếu đã kết thúc.");
    if (c.type === "ticket_assign") {
      if (!["ops-1", "ops-2"].includes(c.assignee))
        return reject("Người phụ trách không hợp lệ.");
      return save(
        {
          tickets: p.tickets.map((v) =>
            v.id === t.id
              ? { ...t, assignee: c.assignee, status: "assigned" }
              : v,
          ),
        },
        audit(
          t.robotId,
          t.id,
          "operation",
          t.status,
          "assigned",
          `Gán ${c.assignee}`,
          c.at,
        ),
      );
    }
    if (!t.assignee) return reject("Cần gán người phụ trách trước.");
    if (c.type === "ticket_progress") {
      if (
        !Number.isInteger(c.progress) ||
        c.progress < t.progress ||
        c.progress < 1 ||
        c.progress > 99 ||
        !c.note.trim()
      )
        return reject("Tiến độ 1–99%, không giảm; cần ghi chú.");
      return save(
        {
          tickets: p.tickets.map((v) =>
            v.id === t.id
              ? { ...t, status: "in_progress", progress: c.progress }
              : v,
          ),
        },
        audit(
          t.robotId,
          t.id,
          "operation",
          `${t.status} ${t.progress}%`,
          `in_progress ${c.progress}%`,
          c.note.trim(),
          c.at,
        ),
      );
    }
    if (t.status !== "in_progress" || !c.result.trim() || !c.verified)
      return reject("Cần đang xử lý, kết quả và xác nhận kiểm tra robot đạt.");
    if (s.sales.some((o) => o.robotId === t.robotId && o.status === "brewing"))
      return reject("Chưa khôi phục khi robot còn đơn đang pha.");
    const unresolvedIncident = s.incidents.some(
      (i) =>
        i.robotId === t.robotId &&
        i.id !== t.incidentId &&
        !p.tickets.some(
          (v) => v.incidentId === i.id && v.status === "resolved",
        ),
    );
    const robot = s.robots.find((r) => r.id === t.robotId)!;
    const nextStatus = unresolvedIncident ? robot.status : "online";
    return save(
      {
        tickets: p.tickets.map((v) =>
          v.id === t.id
            ? {
                ...t,
                status: "resolved",
                progress: 100,
                result: c.result.trim(),
                verifiedAt: c.at,
                verifiedBy: actor.id,
              }
            : v,
        ),
      },
      audit(
        t.robotId,
        t.id,
        "operation",
        `${t.status}; robot=${robot.status}`,
        `resolved; robot=${nextStatus}`,
        c.result.trim(),
        c.at,
      ),
      s.robots.map((r) =>
        r.id === t.robotId ? { ...r, status: nextStatus } : r,
      ),
    );
  }
  if (c.type === "payment_unknown") {
    if (actor.role !== "manager" || !checkOrder(c.id))
      return reject("Không có quyền mô phỏng thanh toán.");
    const o = s.sales.find((o) => o.id === c.id)!;
    if (o.payment !== "pending")
      return reject("Chỉ chuyển thanh toán đang chờ sang chưa xác định.");
    return save(
      {},
      audit(
        o.robotId,
        o.id,
        "finance",
        "pending",
        "unknown",
        "Mạng chậm, cần xác minh",
        c.at,
      ),
      s.robots,
      s.sales.map((v) => (v.id === o.id ? { ...o, payment: "unknown" } : v)),
    );
  }
  if (c.type === "refund_request") {
    if (actor.role !== "owner" || !checkOrder(c.orderId))
      return reject(
        "Chỉ Business Owner trong phạm vi được mô phỏng hoàn tiền.",
      );
    if (p.refunds.some((r) => r.id === c.id)) return { state: s };
    const o = s.sales.find((o) => o.id === c.orderId)!;
    const amount = refundOutstanding(s, o.id);
    if (
      o.payment !== "succeeded" ||
      amount <= 0 ||
      p.refunds.some((r) => r.orderId === o.id && r.status !== "succeeded")
    )
      return reject(
        "Không có khoản cần hoàn mới hoặc đã có yêu cầu chưa kết thúc.",
      );
    return save(
      {
        refunds: [
          ...p.refunds,
          {
            id: c.id,
            orderId: o.id,
            paymentId: o.paymentId ?? `PAY-${o.id}`,
            amount,
            status: "requested",
            createdAt: c.at,
          },
        ],
      },
      audit(
        o.robotId,
        c.id,
        "finance",
        "required",
        "requested",
        `Hoàn ${amount} VND cho ${o.id}`,
        c.at,
      ),
    );
  }
  if (c.type === "refund_status") {
    const r = p.refunds.find((r) => r.id === c.id);
    if (!r || actor.role !== "owner" || !checkOrder(r.orderId))
      return reject("Không có quyền xử lý hoàn tiền.");
    if (r.status === c.status) return { state: s };
    if (
      r.status === "succeeded" ||
      (c.status === "processing"
        ? !["requested", "failed"].includes(r.status)
        : r.status !== "processing")
    )
      return reject("Chuyển trạng thái hoàn tiền không hợp lệ.");
    const o = s.sales.find((o) => o.id === r.orderId)!;
    if (r.amount > refundOutstanding(s, o.id))
      return reject("Số tiền vượt khoản còn được hoàn.");
    return save(
      {
        refunds: p.refunds.map((v) =>
          v.id === r.id
            ? {
                ...r,
                status: c.status,
                ...(c.status === "succeeded" ? { finishedAt: c.at } : {}),
              }
            : v,
        ),
      },
      audit(
        o.robotId,
        r.id,
        "finance",
        r.status,
        c.status,
        `Hoàn ${r.amount} VND`,
        c.at,
      ),
      s.robots,
      s.sales.map((v) =>
        v.id === o.id && c.status === "succeeded"
          ? {
              ...o,
              refund:
                refundOutstanding(s, o.id) === r.amount
                  ? "refunded"
                  : "required",
            }
          : v,
      ),
    );
  }
  if (c.type === "batch_create") {
    const robot = s.robots.find((r) => robotScope(r.id).siteId === c.siteId);
    const scope = robotScope(robot?.id ?? "");
    if (actor.role !== "owner" || !canView(actor, scope))
      return reject("Không có quyền tạo kỳ đối soát.");
    if (p.batches.some((b) => b.id === c.id)) return { state: s };
    if (
      !Number.isFinite(Date.parse(c.start)) ||
      !Number.isFinite(Date.parse(c.end)) ||
      c.start >= c.end
    )
      return reject("Khoảng kỳ không hợp lệ.");
    const overlaps = p.batches.filter(
      (b) =>
        b.scope.siteId === c.siteId &&
        b.scope.tenantId === scope.tenantId &&
        b.start < c.end &&
        c.start < b.end,
    );
    if (
      overlaps.some(
        (b) => b.status !== "closed" || b.start !== c.start || b.end !== c.end,
      )
    )
      return reject("Kỳ đối soát đang mở hoặc chồng lấn không trùng biên.");
    const posted = new Set(
      p.batches
        .filter((b) => b.status === "closed")
        .flatMap((b) => b.transactions.map((t) => t.id)),
    );
    const txs = transactions(s).filter(
      (t) =>
        !posted.has(t.id) &&
        t.scope.siteId === c.siteId &&
        t.scope.tenantId === scope.tenantId &&
        t.at >= c.start &&
        t.at < c.end,
    );
    if (!txs.length) return reject("Không có giao dịch thành công trong kỳ.");
    let lines: StatementLine[] = txs.map((t) => ({
      id: `L-${t.id}`,
      transactionId: t.id,
      amount: t.amount,
      received: true,
    }));
    if (c.scenario === "missing") lines = lines.slice(1);
    if (c.scenario === "mismatch")
      lines[0] = { ...lines[0], amount: lines[0].amount + 1000 };
    if (c.scenario === "duplicate")
      lines.push({ ...lines[0], id: `D-${lines[0].id}` });
    if (c.scenario === "unreceived")
      lines[0] = { ...lines[0], received: false };
    const batch: Batch = {
      id: c.id,
      ...(overlaps.length ? { adjustmentOf: overlaps[0].id } : {}),
      scope,
      start: c.start,
      end: c.end,
      status: "review",
      createdAt: c.at,
      transactions: txs,
      lines,
    };
    return save(
      { batches: [...p.batches, batch] },
      audit(
        robot!.id,
        c.id,
        "finance",
        "",
        "review",
        `Tạo sao kê mẫu: ${c.scenario}`,
        c.at,
      ),
    );
  }
  if (c.type === "statement_set" || c.type === "batch_close") {
    const b = p.batches.find((b) => b.id === c.id);
    if (!b || actor.role !== "owner" || !canView(actor, b.scope))
      return reject("Không có quyền sửa/chốt kỳ này.");
    if (b.status === "closed")
      return c.type === "batch_close"
        ? { state: s }
        : reject("Kỳ đã chốt, không được sửa.");
    const txs = batchTransactions(s, b);
    if (c.type === "statement_set") {
      if (
        !Number.isSafeInteger(c.amount) ||
        !c.note.trim() ||
        !txs.some((t) => t.id === c.transactionId)
      )
        return reject("Cần giao dịch hợp lệ, số tiền nguyên và lý do.");
      const lines = [
        ...b.lines.filter((l) => l.transactionId !== c.transactionId),
        {
          id: `L-${c.transactionId}`,
          transactionId: c.transactionId,
          amount: c.amount,
          received: c.received,
        },
      ];
      return save(
        {
          batches: p.batches.map((v) =>
            v.id === b.id ? { ...b, transactions: txs, lines } : v,
          ),
        },
        audit(
          txs[0].robotId,
          b.id,
          "finance",
          JSON.stringify(
            b.lines.filter((l) => l.transactionId === c.transactionId),
          ),
          JSON.stringify(
            lines.filter((l) => l.transactionId === c.transactionId),
          ),
          c.note.trim(),
          c.at,
        ),
      );
    }
    if (!txs.length || reconciliation(s, b).some((i) => i.status !== "matched"))
      return reject("Còn chênh lệch hoặc chưa xác nhận tiền qua sao kê mẫu.");
    return save(
      {
        batches: p.batches.map((v) =>
          v.id === b.id
            ? { ...b, transactions: txs, status: "closed", closedAt: c.at }
            : v,
        ),
      },
      audit(
        txs[0].robotId,
        b.id,
        "finance",
        "review",
        "closed",
        "Chốt đối soát sao kê mẫu, không phải payout thật",
        c.at,
      ),
    );
  }
  // Existing customer flow goes through the same scope/capability boundary as the new slices.
  const robotId =
    c.type === "create" || c.type === "refill"
      ? c.robotId
      : s.sales.find((o) => o.id === c.id)?.robotId;
  if (
    !robotId ||
    !checkRobot(robotId) ||
    (c.type === "refill" ? !canOperate(actor) : actor.role !== "manager") ||
    ("id" in c && c.type !== "create" && !checkOrder(c.id))
  )
    return reject("Không có quyền thao tác dữ liệu này.");
  const result = transition(s, c);
  if (result.error || result.state === s) return result;
  if (c.type === "refill") return result;
  const history = audit(
    robotId,
    c.id,
    c.type === "finish" ? "operation" : "finance",
    `${s.sales.find((o) => o.id === c.id)?.status ?? ""}; robot=${s.robots.find((r) => r.id === robotId)?.status}`,
    `${result.state.sales.find((o) => o.id === c.id)?.status ?? ""}; robot=${result.state.robots.find((r) => r.id === robotId)?.status}`,
    c.type === "finish"
      ? `${c.cupId}: ${c.success ? "completed" : "failed"}`
      : c.type,
    c.at,
  );
  return {
    state: {
      ...result.state,
      platform: {
        ...platformData(result.state),
        history: [...p.history, history],
      },
    },
  };
}
