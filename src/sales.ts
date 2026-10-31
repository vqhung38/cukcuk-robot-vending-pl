import { robotScope, type Scope } from "./access";
import type { PlatformData } from "./platformTypes";
import { initialRobots, type Robot } from "./data";

export const drinks = [
  { id: "black", name: "Cà phê đen", price: 30000, bom: [2, 0, 1, 1] },
  { id: "milk", name: "Cà phê sữa", price: 35000, bom: [2, 3, 1, 1] },
  { id: "latte", name: "Latte", price: 45000, bom: [2, 5, 1, 1] },
];
export type Cup = {
  id: string;
  status: "queued" | "brewing" | "completed" | "failed";
  finishedAt?: string;
};
export type Sale = {
  id: string;
  robotId: string;
  robotName: string;
  city: string;
  scope?: Scope;
  paymentId?: string;
  drink: string;
  unitPrice: number;
  bom: number[];
  quantity: number;
  total: number;
  createdAt: string;
  paidAt?: string;
  finishedAt?: string;
  payment: "pending" | "succeeded" | "failed" | "unknown";
  status:
    | "awaiting_payment"
    | "paid"
    | "brewing"
    | "completed"
    | "failed"
    | "partially_fulfilled"
    | "payment_failed";
  cups: Cup[];
  refund: "none" | "required" | "refunded";
  refundAmount: number;
};
export type Incident = {
  id: string;
  orderId: string;
  cupId: string;
  robotId: string;
  createdAt: string;
  message: string;
};
export type SalesState = {
  version: 2;
  robots: Robot[];
  sales: Sale[];
  incidents: Incident[];
  platform?: PlatformData;
};
export const STORAGE_KEY = "cukcuk-v2";
export const freshState = (robots: Robot[] = initialRobots): SalesState => ({
  version: 2,
  robots: structuredClone(robots),
  sales: [],
  incidents: [],
});
export type Command =
  | {
      type: "create";
      id: string;
      robotId: string;
      drinkId: string;
      quantity: number;
      at: string;
    }
  | { type: "payment"; id: string; success: boolean; at: string }
  | { type: "start"; id: string; at: string }
  | { type: "finish"; id: string; cupId: string; success: boolean; at: string }
  | { type: "refill"; robotId: string; index: number; amount: number };

// Reservations are derived from open cups; never a second mutable stock counter.
export function availableStock(state: SalesState, robotId: string): number[] {
  const robot = state.robots.find((r) => r.id === robotId);
  if (!robot) return [0, 0, 0, 0];
  return robot.stock.map(
    (stock, i) =>
      stock -
      state.sales
        .filter((o) => o.robotId === robotId && o.payment !== "failed")
        .reduce(
          (sum, o) =>
            sum +
            o.cups.filter(
              (c) => c.status === "queued" || c.status === "brewing",
            ).length *
              o.bom[i],
          0,
        ),
  );
}
export function purchaseError(
  state: SalesState,
  robotId: string,
  drinkId: string,
  quantity: number,
): string | null {
  const robot = state.robots.find((r) => r.id === robotId);
  const drink = drinks.find((d) => d.id === drinkId);
  if (!robot || robot.status !== "online")
    return "Robot không hoạt động, không thể nhận đơn mới.";
  if (!drink) return "Đồ uống không hợp lệ.";
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20)
    return "Số lượng phải là số nguyên từ 1 đến 20.";
  if (
    availableStock(state, robotId).some((v, i) => v < drink.bom[i] * quantity)
  )
    return "Không đủ nguyên liệu khả dụng. Hãy giảm số lượng hoặc chọn món/robot khác.";
  return null;
}
export function transition(
  state: SalesState,
  command: Command,
): { state: SalesState; error?: string } {
  const reject = (error: string) => ({ state, error });
  if (command.type === "create") {
    if (state.sales.some((o) => o.id === command.id)) return { state };
    const error = purchaseError(
      state,
      command.robotId,
      command.drinkId,
      command.quantity,
    );
    if (error) return reject(error);
    const robot = state.robots.find((r) => r.id === command.robotId)!;
    const drink = drinks.find((d) => d.id === command.drinkId)!;
    const sale: Sale = {
      id: command.id,
      robotId: robot.id,
      robotName: robot.name,
      city: robot.city,
      scope: robotScope(robot.id),
      paymentId: `PAY-${command.id}`,
      drink: drink.name,
      unitPrice: drink.price,
      bom: [...drink.bom],
      quantity: command.quantity,
      total: drink.price * command.quantity,
      createdAt: command.at,
      payment: "pending",
      status: "awaiting_payment",
      refund: "none",
      refundAmount: 0,
      cups: Array.from({ length: command.quantity }, (_, i) => ({
        id: `${command.id}-${i + 1}`,
        status: "queued",
      })),
    };
    return { state: { ...state, sales: [...state.sales, sale] } };
  }
  if (command.type === "refill") {
    if (
      !Number.isInteger(command.index) ||
      command.index < 0 ||
      command.index > 3 ||
      !Number.isFinite(command.amount) ||
      command.amount <= 0 ||
      command.amount > 100
    )
      return reject("Lượng bổ sung không hợp lệ.");
    if (!state.robots.some((r) => r.id === command.robotId))
      return reject("Không tìm thấy robot.");
    return {
      state: {
        ...state,
        robots: state.robots.map((r) =>
          r.id === command.robotId
            ? {
                ...r,
                stock: r.stock.map((v, i) =>
                  i === command.index ? Math.min(100, v + command.amount) : v,
                ),
              }
            : r,
        ),
      },
    };
  }
  const order = state.sales.find((o) => o.id === command.id);
  if (!order) return reject("Không tìm thấy đơn hàng.");
  const update = (
    sale: Sale,
    robots = state.robots,
    incidents = state.incidents,
  ) => ({
    state: {
      ...state,
      robots,
      incidents,
      sales: state.sales.map((o) => (o.id === sale.id ? sale : o)),
    },
  });
  if (command.type === "payment") {
    if (order.payment !== "pending" && order.payment !== "unknown")
      return command.success === (order.payment === "succeeded")
        ? { state }
        : reject("Thanh toán đã có kết quả, không thể ghi đè.");
    return update({
      ...order,
      payment: command.success ? "succeeded" : "failed",
      status: command.success ? "paid" : "payment_failed",
      ...(command.success
        ? { paidAt: command.at }
        : { finishedAt: command.at }),
    });
  }
  if (command.type === "start") {
    if (order.status === "brewing") return { state };
    if (order.status !== "paid" || order.payment !== "succeeded")
      return reject("Chỉ được pha đơn đã thanh toán thành công.");
    if (state.robots.find((r) => r.id === order.robotId)?.status !== "online")
      return reject(
        "Robot không hoạt động. Đơn đã trả tiền được giữ lại để xử lý.",
      );
    if (
      state.sales.some(
        (o) => o.robotId === order.robotId && o.status === "brewing",
      )
    )
      return reject("Robot đang pha đơn khác. Vui lòng chờ.");
    return update({
      ...order,
      status: "brewing",
      cups: order.cups.map((c) => ({ ...c, status: "brewing" })),
    });
  }
  const cup = order.cups.find((c) => c.id === command.cupId);
  if (!cup) return reject("Không tìm thấy ly.");
  if (cup.status === "completed" || cup.status === "failed") return { state };
  if (
    order.payment !== "succeeded" ||
    order.status !== "brewing" ||
    cup.status !== "brewing"
  )
    return reject("Ly chưa được bắt đầu pha sau thanh toán.");
  const robot = state.robots.find((r) => r.id === order.robotId)!;
  if (command.success && robot.stock.some((v, i) => v < order.bom[i]))
    return reject("Tồn kho không đủ để hoàn tất ly.");
  const cups: Cup[] = order.cups.map((c) =>
    c.id === cup.id
      ? {
          ...c,
          status: command.success ? "completed" : "failed",
          finishedAt: command.at,
        }
      : c,
  );
  const done = cups.every(
    (c) => c.status === "completed" || c.status === "failed",
  );
  const failed = cups.filter((c) => c.status === "failed").length;
  const sale: Sale = {
    ...order,
    cups,
    refund: failed ? "required" : "none",
    refundAmount: failed * order.unitPrice,
    status: !done
      ? "brewing"
      : failed === 0
        ? "completed"
        : failed === cups.length
          ? "failed"
          : "partially_fulfilled",
    ...(done ? { finishedAt: command.at } : {}),
  };
  const robots = state.robots.map((r) =>
    r.id !== robot.id
      ? r
      : {
          ...r,
          stock: command.success
            ? r.stock.map((v, i) => v - order.bom[i])
            : r.stock,
          status: command.success ? r.status : ("error" as const),
        },
  );
  const incidents = command.success
    ? state.incidents
    : [
        ...state.incidents,
        {
          id: `incident-${cup.id}`,
          orderId: order.id,
          cupId: cup.id,
          robotId: robot.id,
          createdAt: command.at,
          message: `Pha chế thất bại · ${order.drink} · ${cup.id}`,
        },
      ];
  return update(sale, robots, incidents);
}
export function inPeriod(
  at: string,
  period: string,
  now = new Date(),
): boolean {
  const dateKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  const today = new Date(`${dateKey(now)}T00:00:00+07:00`).getTime();
  const days = period === "Hôm nay" ? 1 : period === "7 ngày qua" ? 7 : 30;
  const time = new Date(at).getTime();
  return time >= today - (days - 1) * 86400000 && time < today + 86400000;
}
export function salesMetrics(sales: Sale[], period: string, now = new Date()) {
  const completedCups = sales.flatMap((o) =>
    o.cups
      .filter(
        (c) =>
          c.status === "completed" &&
          c.finishedAt &&
          inPeriod(c.finishedAt, period, now),
      )
      .map(() => o.unitPrice),
  );
  return {
    revenue: completedCups.reduce((sum, price) => sum + price, 0),
    completedOrders: sales.filter(
      (o) =>
        o.status === "completed" &&
        o.finishedAt &&
        inPeriod(o.finishedAt, period, now),
    ).length,
    cups: completedCups.length,
    captured: sales
      .filter(
        (o) =>
          o.payment === "succeeded" &&
          o.paidAt &&
          inPeriod(o.paidAt, period, now),
      )
      .reduce((sum, o) => sum + o.total, 0),
    refundRequired: sales.reduce(
      (sum, o) =>
        sum +
        o.cups.filter(
          (c) =>
            c.status === "failed" &&
            c.finishedAt &&
            inPeriod(c.finishedAt, period, now),
        ).length *
          o.unitPrice,
      0,
    ),
  };
}
export const orderLabels: Record<Sale["status"], string> = {
  awaiting_payment: "Chờ thanh toán",
  paid: "Đã thanh toán · chờ pha",
  brewing: "Đang pha",
  completed: "Hoàn tất",
  failed: "Phục vụ thất bại",
  partially_fulfilled: "Phục vụ một phần",
  payment_failed: "Thanh toán thất bại",
};
export const cupLabels: Record<Cup["status"], string> = {
  queued: "Chờ pha",
  brewing: "Đang pha",
  completed: "Thành công",
  failed: "Pha lỗi",
};
