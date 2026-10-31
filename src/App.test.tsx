import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import App from "./App";
import { getAlerts, initialRobots } from "./data";
beforeEach(() => localStorage.clear());
afterEach(cleanup);
describe("MVP operations", () => {
  it("aggregates revenue and filters region", () => {
    render(<App />);
    expect(screen.getAllByText("35.840.000 ₫").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Khu vực"), {
      target: { value: "Đà Nẵng" },
    });
    expect(screen.getAllByText("3.535.000 ₫").length).toBeGreaterThan(0);
    expect(screen.queryByText("Landmark 81")).toBeNull();
  });
  it("searches and opens robot revenue detail", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quản lý robot" }));
    fireEvent.change(screen.getByLabelText("Tìm robot"), {
      target: { value: "RB-001" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Chi tiết Landmark 81" }),
    );
    expect(screen.getByText("Doanh thu robot")).toBeTruthy();
    expect(screen.getByText("6.510.000 ₫")).toBeTruthy();
  });
  it("refills inventory, clears warning and persists", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Cảnh báo/ }));
    const title = screen.getByText("Sữa tươi sắp hết");
    const row = title.closest(".alert-row")!;
    fireEvent.click(
      within(row as HTMLElement).getByRole("button", { name: "Bổ sung" }),
    );
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận bổ sung" }));
    expect(screen.queryByText("Sữa tươi sắp hết")).toBeNull();
    expect(JSON.parse(localStorage.getItem("cukcuk-v2")!).robots[1].stock[1]).toBe(48);
    cleanup();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Cảnh báo/ }));
    expect(screen.queryByText("Sữa tươi sắp hết")).toBeNull();
  });
  it("acknowledges a fault without falsely changing robot health", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Cảnh báo/ }));
    const row = screen.getByText("Lỗi bộ phận pha chế").closest(".alert-row")!;
    fireEvent.click(
      within(row as HTMLElement).getByRole("button", {
        name: "Tiếp nhận xử lý",
      }),
    );
    expect(
      (
        within(row as HTMLElement).getByRole("button", {
          name: "Đã tiếp nhận",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(getAlerts(initialRobots).length).toBe(5);
  });
  it("shows empty search and changes date totals", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Tìm robot"), {
      target: { value: "unknown" },
    });
    expect(screen.getByText("Không tìm thấy robot phù hợp.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Khoảng thời gian"), {
      target: { value: "7 ngày qua" },
    });
    expect(screen.getAllByText("250.880.000 ₫").length).toBeGreaterThan(0);
  });
});
