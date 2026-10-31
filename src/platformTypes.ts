import type { Scope } from "./access";
export type History = {
  id: string;
  robotId: string;
  entityId: string;
  kind: "operation" | "finance";
  at: string;
  actor: string;
  from: string;
  to: string;
  note: string;
};
export type Ticket = {
  id: string;
  incidentId: string;
  robotId: string;
  status: "open" | "assigned" | "in_progress" | "resolved";
  assignee?: string;
  progress: number;
  result?: string;
  verifiedAt?: string;
  verifiedBy?: string;
};
export type Refund = {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  status: "requested" | "processing" | "failed" | "succeeded";
  createdAt: string;
  finishedAt?: string;
};
export type Transaction = {
  id: string;
  orderId: string;
  robotId: string;
  scope: Scope;
  kind: "capture" | "refund";
  amount: number;
  at: string;
};
export type StatementLine = {
  id: string;
  transactionId: string;
  amount: number;
  received: boolean;
};
export type Batch = {
  id: string;
  adjustmentOf?: string;
  scope: Scope;
  start: string;
  end: string;
  status: "review" | "closed";
  createdAt: string;
  closedAt?: string;
  transactions: Transaction[];
  lines: StatementLine[];
};
export type PlatformData = {
  tickets: Ticket[];
  history: History[];
  refunds: Refund[];
  batches: Batch[];
};
