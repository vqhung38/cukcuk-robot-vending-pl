import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import App from "./App";
import { freshState, STORAGE_KEY, transition } from "./sales";
import { loadState } from "./storage";
const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
const snapshot = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
beforeEach(() => localStorage.clear());
afterEach(cleanup);
function buy(quantity = 1) {
  click("Khách mua cà phê");
  fireEvent.change(screen.getByLabelText("Đồ uống"), {
    target: { value: "milk" },
  });
  fireEvent.change(screen.getByLabelText("Số lượng"), {
    target: { value: String(quantity) },
  });
  click("Tạo đơn hàng");
}
describe("Customer purchase integration / E2E-02 → E2E-03/04", () => {
  it("completes a purchase and keeps dashboard, order, inventory, reports and reload consistent", () => {
    render(<App />);
    buy(2);
    expect(
      screen.queryByRole("button", { name: "Bắt đầu pha chế" }),
    ).toBeNull();
    click("Thanh toán thành công");
    click("Bắt đầu pha chế");
    click("Ly 1 pha thành công");
    click("Ly 2 pha thành công");
    expect(snapshot().sales[0].status).toBe("completed");
    expect(snapshot().robots[0].stock).toEqual([74, 59, 80, 88]);
    click("Tổng quan");
    expect(screen.getAllByText("35.910.000 ₫").length).toBeGreaterThan(0);
    const summary = screen.getByRole("region", {
      name: "Báo cáo đơn mô phỏng",
    });
    expect(within(summary).getAllByText("70.000 ₫")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Khoảng thời gian"), {
      target: { value: "7 ngày qua" },
    });
    expect(screen.getAllByText("250.950.000 ₫").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Khoảng thời gian"), {
      target: { value: "Hôm nay" },
    });
    click("Báo cáo");
    expect(screen.getByText("6.580.000 ₫")).toBeTruthy();
    click("Tồn kho nguyên liệu");
    const card = screen.getByText("Landmark 81").closest(".stock-card")!;
    expect(within(card as HTMLElement).getByText("59%")).toBeTruthy();
    cleanup();
    render(<App />);
    click("Đơn hàng");
    expect(screen.getByText("Hoàn tất")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Ly 1 pha thành công" }),
    ).toBeNull();
    expect(snapshot().robots[0].stock).toEqual([74, 59, 80, 88]);
  });
  it("payment failure is visible with no successful revenue or stock movement", () => {
    render(<App />);
    buy();
    click("Thanh toán thất bại");
    expect(
      screen.queryByRole("button", { name: "Bắt đầu pha chế" }),
    ).toBeNull();
    expect(snapshot().robots[0].stock).toEqual([78, 65, 82, 90]);
    click("Báo cáo");
    const summary = screen.getByRole("region", {
      name: "Báo cáo đơn mô phỏng",
    });
    expect(within(summary).getAllByText("0 ₫")).toHaveLength(3);
    click("Đơn hàng");
    expect(screen.getByText("Thanh toán thất bại")).toBeTruthy();
  });
  it("brew failure retains payment, creates incident, requires refund, and survives reload", () => {
    render(<App />);
    buy();
    click("Thanh toán thành công");
    click("Bắt đầu pha chế");
    click("Ly 1 pha thất bại");
    expect(screen.getByText(/Cần xử lý hoàn tiền: 35.000/)).toBeTruthy();
    expect(snapshot().incidents).toHaveLength(1);
    expect(snapshot().robots[0].stock).toEqual([78, 65, 82, 90]);
    fireEvent.click(screen.getByRole("button", { name: /^Cảnh báo/ }));
    expect(screen.getByText("Sự cố pha chế")).toBeTruthy();
    cleanup();
    render(<App />);
    click("Đơn hàng");
    expect(screen.getByText("Phục vụ thất bại")).toBeTruthy();
    expect(screen.getByText(/Chưa hoàn tiền/)).toBeTruthy();
  });
  it("blocks unavailable stock and disables offline robot options", () => {
    const s = freshState();
    s.robots[0].stock = [0, 0, 0, 0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    render(<App />);
    click("Khách mua cà phê");
    expect(
      (screen.getByRole("option", { name: /RB-006/ }) as HTMLOptionElement)
        .disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Tạo đơn hàng",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByText(/Không đủ nguyên liệu khả dụng/)).toBeTruthy();
    expect(snapshot().sales).toHaveLength(0);
  });
  it("resumes a paid order after reload without repeating payment", () => {
    render(<App />);
    buy();
    click("Thanh toán thành công");
    cleanup();
    render(<App />);
    click("Đơn hàng");
    expect(
      screen.queryByRole("button", { name: "Thanh toán thành công" }),
    ).toBeNull();
    click("Bắt đầu pha chế");
    click("Ly 1 pha thành công");
    expect(snapshot().sales[0].status).toBe("completed");
  });
  it("migrates legacy stock and reload preserves open reservations and completed effects", () => {
    const legacy = freshState().robots;
    legacy[0].stock[1] = 50;
    localStorage.setItem("cukcuk-v1", JSON.stringify(legacy));
    let s = loadState();
    expect(s.robots[0].stock[1]).toBe(50);
    s = transition(s, {
      type: "create",
      id: "persisted",
      robotId: "RB-001",
      drinkId: "latte",
      quantity: 2,
      at: new Date().toISOString(),
    }).state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    expect(loadState()).toEqual(s);
  });
  it("handles malformed persisted data without crashing", () => {
    localStorage.setItem(STORAGE_KEY, "{bad json");
    expect(loadState().sales).toEqual([]);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...freshState(), sales: [null] }),
    );
    expect(loadState().sales).toEqual([]);
  });
});
