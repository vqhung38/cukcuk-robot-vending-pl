import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import App from "./App";
import { freshState, STORAGE_KEY } from "./sales";
import { execute, platformData } from "./platform";
import { profiles } from "./access";
import { loadState } from "./storage";
const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
const change = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } });
const role = (id: string) => change("Vai trò demo", id);
const snapshot = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function failedOrder(robotId = "RB-001") {
  let s = freshState();
  const at = new Date().toISOString();
  for (const c of [
    {
      type: "create",
      id: "TEST-ORDER",
      robotId,
      drinkId: "milk",
      quantity: 1,
      at,
    },
    { type: "payment", id: "TEST-ORDER", success: true, at },
    { type: "start", id: "TEST-ORDER", at },
    {
      type: "finish",
      id: "TEST-ORDER",
      cupId: "TEST-ORDER-1",
      success: false,
      at,
    },
  ] as const)
    s = execute(s, c, profiles[0]).state;
  return s;
}
describe("Operations and finance UI integration", () => {
  it("simulates an incident through verified recovery and persists its full history", () => {
    render(<App />);
    role("provider");
    click("Phát sinh sự cố");
    click("Mở phiếu xử lý");
    click("Gán người phụ trách");
    change("Ghi chú tiến độ", "Thay nguồn và kiểm tra kết nối");
    change("Tiến độ (%)", "60");
    click("Cập nhật tiến độ");
    change("Kết quả khắc phục", "Pha thử và kết nối đạt");
    fireEvent.click(
      screen.getByLabelText("Đã kiểm tra kết nối và pha thử đạt (giả lập)"),
    );
    click("Ghi kết quả và khôi phục");
    expect(snapshot().robots[0].status).toBe("online");
    expect(platformData(snapshot()).tickets[0].status).toBe("resolved");
    expect(screen.getByText("Cảnh báo sự cố chưa giải quyết (0)")).toBeTruthy();
    cleanup();
    render(<App />);
    click("Vận hành robot");
    expect(screen.getByText("Kết quả: Pha thử và kết nối đạt")).toBeTruthy();
    expect(platformData(snapshot()).history).toHaveLength(5);
  });
  it("runs refund failure/retry and reconciliation without declaring paid orders settled", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(failedOrder()));
    render(<App />);
    role("owner");
    click("Đối soát");
    let summary = screen.getByRole("region", { name: "Tổng hợp tài chính" });
    expect(
      within(summary).getByText("Tiền đã đối soát qua sao kê mẫu").textContent,
    ).toContain("0 ₫");
    click("Tạo yêu cầu hoàn tiền");
    click("Bắt đầu hoàn tiền");
    click("Hoàn tiền thất bại");
    expect(snapshot().platform.refunds[0].status).toBe("failed");
    click("Bắt đầu hoàn tiền");
    click("Hoàn tiền thành công");
    expect(snapshot().sales[0].refund).toBe("refunded");
    expect(
      within(summary).getByText("Còn cần hoàn (mọi kỳ)").textContent,
    ).toContain("0 ₫");
    click("Tạo kỳ đối soát mẫu");
    expect(screen.getByText("Thiếu sao kê")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Chốt kỳ đối soát",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    change("Giao dịch sửa sao kê", "PAY-TEST-ORDER");
    change("Số tiền sao kê", "35000");
    change("Lý do sửa sao kê", "Kiểm chứng sao kê mẫu");
    fireEvent.click(screen.getByLabelText("Xác nhận tiền trên sao kê mẫu"));
    click("Lưu sao kê mẫu");
    click("Chốt kỳ đối soát");
    expect(snapshot().platform.batches[0].status).toBe("closed");
    expect(
      snapshot().platform.batches[0].transactions.map(
        (t: { amount: number }) => t.amount,
      ),
    ).toEqual([35000, -35000]);
    cleanup();
    render(<App />);
    role("owner");
    click("Đối soát");
    expect(screen.getByText(/Đã chốt/)).toBeTruthy();
    expect(loadState()).toEqual(snapshot());
  });
  it("restricted manager never renders hidden robot/financial data and role changes clear details", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(failedOrder("RB-005")));
    render(<App />);
    click("Quản lý robot");
    fireEvent.click(
      screen.getByRole("button", { name: "Chi tiết Lotte Center" }),
    );
    role("manager-south");
    click("Quản lý robot");
    expect(screen.queryByText("Lotte Center")).toBeNull();
    expect(screen.queryByText("FPT Complex")).toBeNull();
    click("Đơn hàng");
    expect(screen.queryByText("TEST-ORDER")).toBeNull();
    click("Đối soát");
    expect(screen.queryByText("PAY-TEST-ORDER")).toBeNull();
    role("provider");
    expect(screen.queryByRole("button", { name: "Đối soát" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Xuất báo cáo" })).toBeNull();
    click("Quản lý robot");
    expect(screen.queryByText("DOANH THU")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Chi tiết Lotte Center" }),
    );
    expect(screen.queryByText("Doanh thu robot")).toBeNull();
  });
  it("owner is read-only for operations and manager cannot request refunds or close reconciliation", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(failedOrder()));
    render(<App />);
    click("Đối soát");
    expect(
      screen.queryByRole("button", { name: "Tạo yêu cầu hoàn tiền" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Tạo kỳ đối soát mẫu" }),
    ).toBeNull();
    role("owner");
    click("Vận hành robot");
    expect(
      screen.queryByRole("button", { name: "Phát sinh sự cố" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Mở phiếu xử lý" })).toBeNull();
    click("Đơn hàng");
    expect(
      screen.queryByRole("button", { name: "Thanh toán thành công" }),
    ).toBeNull();
  });
  it("offers unknown payment simulation and keeps it out of capture until verified", () => {
    render(<App />);
    click("Khách mua cà phê");
    click("Tạo đơn hàng");
    click("Thanh toán chưa xác định");
    expect(screen.getByText(/Chưa xác định · cần xác minh/)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Bắt đầu pha chế" }),
    ).toBeNull();
    click("Thanh toán thành công");
    click("Bắt đầu pha chế");
    click("Ly 1 pha thành công");
    expect(snapshot().sales[0].status).toBe("completed");
  });
  it("exports only scoped robot financial rows", () => {
    const blobs: Blob[] = [];
    vi.stubGlobal("URL", {
      createObjectURL: (blob: Blob) => {
        blobs.push(blob);
        return "blob:mock";
      },
      revokeObjectURL: () => {},
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<App />);
    role("manager-south");
    click("Xuất báo cáo");
    expect(blobs).toHaveLength(1);
    // FileReader works in jsdom and validates the actual CSV payload.
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const csv = String(reader.result);
          expect(csv).toContain("RB-001");
          expect(csv).not.toContain("RB-005");
          expect(csv).toContain("Đã đối soát sao kê mẫu");
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsText(blobs[0]);
    }).finally(() => vi.unstubAllGlobals());
  });
});
