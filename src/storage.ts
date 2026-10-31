import { initialRobots, type Robot } from "./data";
import { freshState, STORAGE_KEY, type SalesState } from "./sales";
function validRobots(value: unknown): value is Robot[] {
  return (
    Array.isArray(value) &&
    value.length === initialRobots.length &&
    new Set(value.map((r) => r?.id)).size === value.length &&
    value.every(
      (r) =>
        r &&
        initialRobots.some((s) => s.id === r.id) &&
        typeof r.name === "string" &&
        typeof r.city === "string" &&
        typeof r.location === "string" &&
        Number.isFinite(r.revenue) &&
        r.revenue >= 0 &&
        Number.isInteger(r.orders) &&
        r.orders >= 0 &&
        ["online", "offline", "error"].includes(r.status) &&
        Array.isArray(r.stock) &&
        r.stock.length === 4 &&
        r.stock.every((n: number) => Number.isFinite(n) && n >= 0 && n <= 100),
    )
  );
}
export function loadState(): SalesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (
        s.version !== 2 ||
        !validRobots(s.robots) ||
        !Array.isArray(s.sales) ||
        !Array.isArray(s.incidents)
      )
        throw new Error("invalid");
      // Reject malformed snapshots instead of crashing a screen or executing unknown transitions.
      for (const o of s.sales) {
        if (
          !o ||
          typeof o.id !== "string" ||
          !s.robots.some((r: Robot) => r.id === o.robotId) ||
          typeof o.drink !== "string" ||
          typeof o.city !== "string" ||
          !Number.isInteger(o.quantity) ||
          o.quantity < 1 ||
          o.quantity > 20 ||
          !Number.isInteger(o.unitPrice) ||
          o.unitPrice < 0 ||
          o.total !== o.unitPrice * o.quantity ||
          !Array.isArray(o.bom) ||
          o.bom.length !== 4 ||
          o.bom.some((n: number) => !Number.isFinite(n) || n < 0) ||
          !["pending", "succeeded", "failed"].includes(o.payment) ||
          ![
            "awaiting_payment",
            "paid",
            "brewing",
            "completed",
            "failed",
            "partially_fulfilled",
            "payment_failed",
          ].includes(o.status) ||
          !Array.isArray(o.cups) ||
          o.cups.length !== o.quantity ||
          o.cups.some(
            (c: { id: string; status: string }) =>
              !c ||
              typeof c.id !== "string" ||
              !["queued", "brewing", "completed", "failed"].includes(c.status),
          ) ||
          !Number.isFinite(Date.parse(o.createdAt))
        )
          throw new Error("invalid");
      }
      if (
        new Set(s.sales.map((o: { id: string }) => o.id)).size !==
          s.sales.length ||
        s.incidents.some(
          (i: { id: string; message: string }) =>
            !i || typeof i.id !== "string" || typeof i.message !== "string",
        )
      )
        throw new Error("invalid");
      return s;
    }
    const legacy = JSON.parse(localStorage.getItem("cukcuk-v1") || "null");
    return freshState(validRobots(legacy) ? legacy : initialRobots);
  } catch {
    return freshState();
  }
}
