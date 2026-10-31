import type { Sale, SalesState } from "./sales";
export type Scope = { tenantId: string; chainId: string; siteId: string };
export type Actor = {
  id: string;
  name: string;
  role: "provider" | "manager" | "owner";
  tenantId: string;
  chainIds?: string[];
};
export const profiles: Actor[] = [
  {
    id: "manager",
    name: "Chain Manager · các chuỗi được giao",
    role: "manager",
    tenantId: "tenant-a",
    chainIds: ["south", "north", "central"],
  },
  {
    id: "manager-south",
    name: "Chain Manager · chuỗi Miền Nam",
    role: "manager",
    tenantId: "tenant-a",
    chainIds: ["south"],
  },
  {
    id: "provider",
    name: "Provider Operations",
    role: "provider",
    tenantId: "tenant-a",
  },
  { id: "owner", name: "Business Owner", role: "owner", tenantId: "tenant-a" },
];
export const sites = [
  { id: "hcm-1", name: "Điểm bán Sài Gòn 1", chainId: "south" },
  { id: "hcm-2", name: "Điểm bán Sài Gòn 2", chainId: "south" },
  { id: "hn", name: "Điểm bán Hà Nội", chainId: "north" },
  { id: "dn", name: "Điểm bán Đà Nẵng", chainId: "central" },
];
export const chainNames: Record<string, string> = {
  south: "Chuỗi Miền Nam",
  north: "Chuỗi Miền Bắc",
  central: "Chuỗi Miền Trung",
};
export function robotScope(id: string): Scope {
  const site = ["RB-001", "RB-002"].includes(id)
    ? sites[0]
    : ["RB-003", "RB-004", "RB-007"].includes(id)
      ? sites[1]
      : ["RB-005", "RB-006"].includes(id)
        ? sites[2]
        : id === "RB-008"
          ? sites[3]
          : null;
  return site
    ? { tenantId: "tenant-a", chainId: site.chainId, siteId: site.id }
    : { tenantId: "unknown", chainId: "unknown", siteId: "unknown" };
}
export const saleScope = (o: Sale): Scope => o.scope ?? robotScope(o.robotId);
export function canView(actor: Actor, scope: Scope) {
  return (
    actor.tenantId === scope.tenantId &&
    (actor.role !== "manager" || !!actor.chainIds?.includes(scope.chainId))
  );
}
export const canFinance = (actor: Actor) => actor.role !== "provider";
export const canOperate = (actor: Actor) => actor.role !== "owner";
export function scopedState(state: SalesState, actor: Actor): SalesState {
  const robots = state.robots.filter((r) => canView(actor, robotScope(r.id)));
  const ids = new Set(robots.map((r) => r.id));
  return {
    ...state,
    robots: canFinance(actor)
      ? robots
      : robots.map((r) => ({ ...r, revenue: 0, orders: 0 })),
    sales: canFinance(actor)
      ? state.sales.filter((o) => canView(actor, saleScope(o)))
      : [],
    incidents: state.incidents.filter((i) => ids.has(i.robotId)),
    platform: state.platform
      ? {
          ...state.platform,
          tickets: state.platform.tickets.filter((t) => ids.has(t.robotId)),
          history: state.platform.history.filter(
            (h) =>
              ids.has(h.robotId) &&
              (canFinance(actor) || h.kind === "operation"),
          ),
          refunds: canFinance(actor)
            ? state.platform.refunds.filter((r) =>
                state.sales.some(
                  (o) => o.id === r.orderId && canView(actor, saleScope(o)),
                ),
              )
            : [],
          batches: canFinance(actor)
            ? state.platform.batches.filter((b) => canView(actor, b.scope))
            : [],
        }
      : undefined,
  };
}
