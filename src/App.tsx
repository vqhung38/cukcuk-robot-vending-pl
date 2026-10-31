import { useEffect, useReducer, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bot,
  Box,
  CalendarDays,
  Check,
  Coffee,
  LayoutDashboard,
  MapPin,
  Search,
  Settings,
  ShoppingBag,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { getAlerts, ingredients, money, statusLabel } from "./data";
import { Chart } from "./components/Chart";
import { RobotTable } from "./components/RobotTable";
import { Stat, PanelHeading, StockRow } from "./components/ui";
import {
  availableStock,
  salesMetrics,
  inPeriod,
  STORAGE_KEY,
  transition,
  type Command,
} from "./sales";
import { loadState } from "./storage";
import { CustomerShop, SaleDetail } from "./components/CustomerShop";
type Page =
  | "Tổng quan"
  | "Quản lý robot"
  | "Tồn kho nguyên liệu"
  | "Cảnh báo"
  | "Khách mua cà phê"
  | "Đơn hàng"
  | "Báo cáo";
export default function App() {
  const [store, dispatch] = useReducer(
    (
      current: { state: ReturnType<typeof loadState>; error?: string },
      command: Command,
    ) => transition(current.state, command),
    undefined,
    () => ({ state: loadState(), error: undefined }),
  );
  const state = store.state;
  const robots = state.robots;
  const send = (command: Command) => dispatch(command);
  const [storageError, setStorageError] = useState("");
  const [page, setPage] = useState<Page>("Tổng quan");
  const [city, setCity] = useState("Tất cả khu vực");
  const [period, setPeriod] = useState("Hôm nay");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [refill, setRefill] = useState<{ id: string; index: number } | null>(
    null,
  );
  const [amount, setAmount] = useState(25);
  const [toast, setToast] = useState("");
  const [ack, setAck] = useState<string[]>([]);
  const [alertTab, setAlertTab] = useState("all");
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError("");
    } catch {
      setStorageError(
        "Không lưu được dữ liệu trên trình duyệt. Hãy giữ trang mở; thay đổi có thể mất khi tải lại.",
      );
    }
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRefill(null);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const scoped = robots.filter(
    (r) => city === "Tất cả khu vực" || r.city === city,
  );
  const visible = scoped.filter(
    (r) =>
      (r.name + " " + r.id + " " + r.city)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" || r.status === status),
  );
  const alerts = getAlerts(scoped);
  const multiplier =
    period === "Hôm nay" ? 1 : period === "7 ngày qua" ? 7 : 30;
  const periodRobots = robots.map((r) => {
    const metrics = salesMetrics(
      state.sales.filter((o) => o.robotId === r.id),
      period,
    );
    return {
      ...r,
      revenue: r.revenue * multiplier + metrics.revenue,
      orders: r.orders * multiplier + metrics.completedOrders,
    };
  });
  const displayRobots = periodRobots.filter((r) =>
    visible.some((v) => v.id === r.id),
  );
  const scopedDisplay = periodRobots.filter((r) =>
    scoped.some((v) => v.id === r.id),
  );
  const revenue = scopedDisplay.reduce((a, r) => a + r.revenue, 0);
  const orders = scopedDisplay.reduce((a, r) => a + r.orders, 0);
  const robot = periodRobots.find((r) => r.id === selected);
  const scopedSales = state.sales.filter(
    (o) => city === "Tất cả khu vực" || o.city === city,
  );
  const metrics = salesMetrics(scopedSales, period);
  const periodSales = scopedSales.filter((o) => {
    // Include orders with any activity in the selected reporting window.
    return (
      inPeriod(o.createdAt, period) ||
      (!!o.paidAt && inPeriod(o.paidAt, period)) ||
      o.cups.some((c) => c.finishedAt && inPeriod(c.finishedAt, period))
    );
  });
  const navigate = (p: Page) => {
    setPage(p);
    setSelected(null);
    setQuery("");
    setStatus("all");
  };
  function exportCsv() {
    const rows = [
      [
        "Dữ liệu giả lập",
        "Kỳ: " + period,
        "VND",
        "Asia/Ho_Chi_Minh",
        "Nền lịch sử minh họa + đơn mô phỏng thực tế trong kỳ",
      ],
      [
        "Robot",
        "Điểm bán",
        "Khu vực",
        "Trạng thái",
        "Đơn hoàn tất",
        "Doanh thu ly thành công",
        "Tiền thu đơn mới",
        "Cần hoàn đơn mới",
        "Doanh thu đơn mới",
      ],
      ...displayRobots.map((r) => [
        r.id,
        r.name,
        r.city,
        statusLabel[r.status],
        r.orders,
        r.revenue,
        salesMetrics(
          state.sales.filter((o) => o.robotId === r.id),
          period,
        ).captured,
        salesMetrics(
          state.sales.filter((o) => o.robotId === r.id),
          period,
        ).refundRequired,
        salesMetrics(
          state.sales.filter((o) => o.robotId === r.id),
          period,
        ).revenue,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        [
          "\uFEFF" +
            rows
              .map((row) =>
                row
                  .map((v) => '"' + String(v).replaceAll('"', '""') + '"')
                  .join(","),
              )
              .join("\r\n"),
        ],
        { type: "text/csv;charset=utf-8;" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "cukcuk-bao-cao.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Đã xuất báo cáo CSV");
  }
  const openRefill = (id: string, index: number) => {
    setAmount(25);
    setRefill({ id, index });
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Tổng quan");
          }}
        >
          <span className="brand-mark">
            <Coffee size={25} />
          </span>
          cukcuk<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">C</span>
          <div>
            <strong>CukCuk Coffee</strong>
            <small>Không gian quản lý chuỗi</small>
          </div>
          <span className="live-dot" />
        </div>
        <p className="nav-label">KHÔNG GIAN LÀM VIỆC</p>
        <nav>
          {(
            [
              [LayoutDashboard, "Tổng quan"],
              [Bot, "Quản lý robot"],
              [Box, "Tồn kho nguyên liệu"],
              [Bell, "Cảnh báo"],
              [Coffee, "Khách mua cà phê"],
              [ShoppingBag, "Đơn hàng"],
              [Wallet, "Báo cáo"],
            ] as const
          ).map(([Icon, label]) => (
            <button
              key={label}
              className={page === label ? "nav-item active" : "nav-item"}
              onClick={() => navigate(label)}
            >
              <Icon size={20} />
              {label}
              {label === "Cảnh báo" && alerts.length > 0 && (
                <b>{alerts.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="system">
            <span className="live-dot" />
            <span>Hệ thống vận hành ổn định</span>
          </div>
          <div className="profile">
            <span className="avatar">HN</span>
            <div>
              <strong>Hoàng Nguyễn</strong>
              <small>Quản lý chuỗi</small>
            </div>
            <Settings size={17} aria-label="Tài khoản mẫu" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="muted">Không gian làm việc</span>
            <span className="slash">/</span>
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <span className="demo">
              <i /> Dữ liệu mẫu
            </span>
            <button
              className="notification icon-button"
              aria-label="Mở cảnh báo"
              onClick={() => navigate("Cảnh báo")}
            >
              <Bell size={20} />
              <i />
            </button>
            <span className="divider" />
            <span className="avatar small">HN</span>
          </div>
        </header>
        <main>
          {(store.error || storageError) && (
            <p className="purchase-warning" role="alert">
              {store.error || storageError}
            </p>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                CUKCUK OPERATIONS <span> / </span> COFFEE & TECHNOLOGY
              </div>
              <h1>
                {robot
                  ? robot.name
                  : page === "Tổng quan"
                    ? "Tổng quan vận hành"
                    : page}
              </h1>
              <p>
                {robot
                  ? `${robot.id} · ${robot.location} · ${robot.city}`
                  : page === "Tổng quan"
                    ? "Một góc nhìn toàn diện. Mọi điểm bán trong tầm tay."
                    : page === "Quản lý robot"
                      ? "Theo dõi và quản lý các robot trong chuỗi của bạn."
                      : page === "Tồn kho nguyên liệu"
                        ? "Chủ động bổ sung để mỗi ly cà phê luôn sẵn sàng."
                        : page === "Khách mua cà phê"
                          ? "Chọn món, mô phỏng thanh toán và theo dõi từng ly."
                          : page === "Đơn hàng"
                            ? "Theo dõi đơn, thanh toán, kết quả pha và khoản cần hoàn."
                            : page === "Báo cáo"
                              ? "Doanh thu, tiền thu và hoàn tiền từ cùng một nguồn dữ liệu."
                              : "Theo dõi sự cố và những điểm bán cần được chú ý."}
              </p>
            </div>
            <button className="button" onClick={exportCsv}>
              <ArrowDownToLine size={16} /> Xuất báo cáo
            </button>
          </div>
          <div className="filters">
            <div className="filter-left">
              <label className="select-box">
                <MapPin size={16} />
                <select
                  aria-label="Khu vực"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {[
                    "Tất cả khu vực",
                    "TP. Hồ Chí Minh",
                    "Hà Nội",
                    "Đà Nẵng",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="select-box">
                <CalendarDays size={16} />
                <select
                  aria-label="Khoảng thời gian"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  {["Hôm nay", "7 ngày qua", "30 ngày qua"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <span className="updated">
              <span className="live-dot" /> Bản mô phỏng · 31/10/2026
            </span>
          </div>
          <p className="simulation-note">
            Dữ liệu giả lập · Nền lịch sử minh họa; đơn mới tính theo thời gian
            phát sinh (giờ Việt Nam), không nhân theo kỳ.
          </p>
          {robot ? (
            <>
              <button
                className="text-button back"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft size={16} /> Quay lại {page.toLowerCase()}
              </button>
              <div className="detail-banner">
                <span className="robot-icon large">
                  <Bot size={32} />
                </span>
                <div>
                  <h2>{robot.name}</h2>
                  <p>{robot.location}</p>
                </div>
                <span className={"badge " + robot.status}>
                  <i />
                  {statusLabel[robot.status]}
                </span>
              </div>
              <div className="stats three">
                <Stat
                  title="Doanh thu robot"
                  value={money(robot.revenue)}
                  icon={<Wallet size={20} />}
                  note={period}
                />
                <Stat
                  title="Đơn hàng thành công"
                  value={robot.orders.toLocaleString("vi-VN")}
                  icon={<ShoppingBag size={20} />}
                  note={period}
                />
                <Stat
                  title="Giá trị trung bình / đơn"
                  value={money(robot.orders ? robot.revenue / robot.orders : 0)}
                  icon={<Coffee size={20} />}
                  note="Theo dữ liệu mô phỏng"
                />
              </div>
              <section className="panel">
                <PanelHeading
                  title="Doanh thu theo thời gian"
                  subtitle="Đơn vị: triệu đồng"
                />
                <Chart period={period} base={robot.revenue} />
              </section>
              <section className="panel inventory-detail">
                <PanelHeading
                  title="Nguyên liệu của robot"
                  subtitle="Ngưỡng cảnh báo dưới 25%"
                />
                {robot.stock.map((v, i) => (
                  <StockRow
                    key={i}
                    value={v}
                    name={ingredients[i]}
                    onRefill={() => openRefill(robot.id, i)}
                  />
                ))}
              </section>
            </>
          ) : (
            <>
              {page === "Khách mua cà phê" && (
                <CustomerShop state={state} send={send} />
              )}
              {page === "Đơn hàng" && (
                <section aria-label="Danh sách đơn hàng">
                  <p>
                    Đơn giả lập theo khu vực và kỳ đang chọn. Có thể tiếp tục
                    thanh toán/pha sau khi tải lại trang.
                  </p>
                  {periodSales.length ? (
                    [...periodSales]
                      .reverse()
                      .map((order) => (
                        <SaleDetail key={order.id} order={order} send={send} />
                      ))
                  ) : (
                    <div className="empty">Chưa có đơn mô phỏng trong kỳ.</div>
                  )}
                </section>
              )}
              {(page === "Tổng quan" || page === "Báo cáo") && (
                <section
                  className="panel sales-summary"
                  aria-label="Báo cáo đơn mô phỏng"
                >
                  <h2>Đơn mua cà phê mô phỏng · {period}</h2>
                  <div className="sales-numbers">
                    <p>
                      Doanh thu ly thành công
                      <strong>{money(metrics.revenue)}</strong>
                    </p>
                    <p>
                      Tiền đã thanh toán
                      <strong>{money(metrics.captured)}</strong>
                    </p>
                    <p>
                      Cần xử lý hoàn tiền
                      <strong>{money(metrics.refundRequired)}</strong>
                    </p>
                    <p>
                      Đơn hoàn tất / Ly thành công
                      <strong>
                        {metrics.completedOrders} / {metrics.cups}
                      </strong>
                    </p>
                  </div>
                  <p>
                    Tiền đã thanh toán chưa phải doanh thu nếu ly chưa pha thành
                    công. Khoản cần hoàn chưa được chi trả.
                  </p>
                </section>
              )}
              {page === "Báo cáo" && (
                <section className="panel">
                  <PanelHeading
                    title="Báo cáo theo robot"
                    subtitle="Cùng nguồn số liệu với dashboard và CSV; bao gồm nền lịch sử minh họa."
                  />
                  <RobotTable
                    robots={displayRobots}
                    onSelect={(r) => setSelected(r.id)}
                  />
                </section>
              )}
              {page === "Tổng quan" && (
                <>
                  <div className="stats">
                    <Stat
                      title="Tổng doanh thu"
                      value={money(revenue)}
                      icon={<Wallet size={20} />}
                      note="Tổng doanh thu các điểm bán"
                    />
                    <Stat
                      title="Đơn hàng thành công"
                      value={orders.toLocaleString("vi-VN")}
                      icon={<ShoppingBag size={20} />}
                      note="Từ tất cả robot trong khu vực"
                    />
                    <Stat
                      title="Robot đang hoạt động"
                      value={`${scoped.filter((r) => r.status === "online").length} / ${scoped.length}`}
                      icon={<Bot size={20} />}
                      note={`${scoped.filter((r) => r.status !== "online").length} robot cần kiểm tra`}
                    />
                    <Stat
                      title="Cảnh báo cần chú ý"
                      value={String(alerts.length).padStart(2, "0")}
                      icon={<Bell size={20} />}
                      note={`${alerts.filter((a) => a.kind === "stock").length} nguyên liệu sắp hết`}
                      warning
                    />
                  </div>
                  <div className="overview-grid">
                    <section className="panel revenue-panel">
                      <PanelHeading
                        title="Tổng quan doanh thu"
                        subtitle={
                          period === "Hôm nay"
                            ? "Doanh thu theo giờ trong ngày"
                            : "Doanh thu mô phỏng theo ngày"
                        }
                      >
                        <span className="legend">
                          <i /> Doanh thu
                        </span>
                      </PanelHeading>
                      <div className="chart-total">
                        {money(revenue)} <span>{period}</span>
                      </div>
                      <Chart period={period} base={revenue} />
                    </section>
                    <section className="panel fleet-panel">
                      <PanelHeading
                        title="Sức khỏe hệ thống"
                        subtitle="Trạng thái kết nối robot"
                      />
                      <div
                        className="donut"
                        style={{
                          background: `conic-gradient(#287b59 0 ${(scoped.filter((r) => r.status === "online").length / Math.max(scoped.length, 1)) * 100}%, #e9ad4c 0 ${(scoped.filter((r) => r.status !== "offline").length / Math.max(scoped.length, 1)) * 100}%, #dce2df 0 100%)`,
                        }}
                      >
                        <div>
                          <strong>{scoped.length}</strong>
                          <span>Tổng số robot</span>
                        </div>
                      </div>
                      <div className="status-summary">
                        {(["online", "error", "offline"] as const).map((s) => (
                          <div key={s}>
                            <span>
                              <i className={s} />
                              {statusLabel[s]}
                            </span>
                            <strong>
                              {scoped
                                .filter((r) => r.status === s)
                                .length.toString()
                                .padStart(2, "0")}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                  {alerts.length > 0 && (
                    <div className="alert-strip">
                      <span className="alert-icon">
                        <Zap size={19} />
                      </span>
                      <div>
                        <strong>
                          {alerts.length} cảnh báo cần sự chú ý của bạn
                        </strong>
                        <span>
                          Kiểm tra và xử lý để chuỗi luôn vận hành trơn tru.
                        </span>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => navigate("Cảnh báo")}
                      >
                        Xem cảnh báo <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
              {(page === "Tổng quan" || page === "Quản lý robot") && (
                <section className="panel robot-panel">
                  <PanelHeading
                    title={
                      page === "Tổng quan"
                        ? "Hoạt động của robot"
                        : "Danh sách robot"
                    }
                    subtitle={`${visible.length} robot trong chuỗi của bạn`}
                  >
                    {page === "Tổng quan" && (
                      <button
                        className="text-button"
                        onClick={() => navigate("Quản lý robot")}
                      >
                        Xem tất cả <ArrowRight size={15} />
                      </button>
                    )}
                  </PanelHeading>
                  <div className="table-filters">
                    <div className="tabs">
                      {[
                        ["all", "Tất cả"],
                        ["online", "Đang hoạt động"],
                        ["error", "Có lỗi"],
                        ["offline", "Mất kết nối"],
                      ].map(([v, l]) => (
                        <button
                          className={status === v ? "selected" : ""}
                          key={v}
                          onClick={() => setStatus(v)}
                        >
                          {l}
                          {v === "all" && <span>{scoped.length}</span>}
                        </button>
                      ))}
                    </div>
                    <label className="search">
                      <Search size={16} />
                      <input
                        aria-label="Tìm robot"
                        placeholder="Tìm tên hoặc mã robot..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  <RobotTable
                    robots={displayRobots}
                    onSelect={(r) => setSelected(r.id)}
                  />
                  <div className="table-footer">
                    Hiển thị {visible.length} / {scoped.length} robot{" "}
                    <span>Doanh thu {period.toLowerCase()} · VND</span>
                  </div>
                </section>
              )}
              {page === "Tồn kho nguyên liệu" && (
                <>
                  <div className="inventory-toolbar">
                    <label className="search">
                      <Search size={16} />
                      <input
                        aria-label="Tìm robot"
                        placeholder="Tìm robot hoặc điểm bán..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <span className="muted">
                      Mức tồn kho theo % sức chứa · Cảnh báo dưới 25%
                    </span>
                  </div>
                  <div className="inventory-grid">
                    {visible.map((r) => (
                      <section className="panel stock-card" key={r.id}>
                        <div className="stock-card-title">
                          <span className="robot-icon">
                            <Coffee size={20} />
                          </span>
                          <div>
                            <button
                              className="text-button"
                              onClick={() => setSelected(r.id)}
                            >
                              {r.name} <ArrowUpRight size={14} />
                            </button>
                            <small>
                              {r.id} · {r.city}
                            </small>
                          </div>
                        </div>
                        <p className="stock-available">
                          Khả dụng sau giữ chỗ:{" "}
                          {availableStock(state, r.id).join(" / ")}%
                        </p>
                        {r.stock.map((v, i) => (
                          <StockRow
                            key={i}
                            name={ingredients[i]}
                            value={v}
                            onRefill={() => openRefill(r.id, i)}
                          />
                        ))}
                      </section>
                    ))}
                  </div>
                  {!visible.length && (
                    <div className="empty">Không tìm thấy robot phù hợp.</div>
                  )}
                </>
              )}
              {page === "Cảnh báo" && (
                <section className="panel">
                  <PanelHeading
                    title="Trung tâm cảnh báo"
                    subtitle="Xác nhận tiếp nhận sự cố; bổ sung nguyên liệu sẽ tự xóa cảnh báo tương ứng."
                  />
                  <div className="tabs alert-tabs">
                    {[
                      ["all", "Tất cả"],
                      ["error", "Sự cố robot"],
                      ["stock", "Nguyên liệu"],
                    ].map(([v, l]) => (
                      <button
                        key={v}
                        className={alertTab === v ? "selected" : ""}
                        onClick={() => setAlertTab(v)}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  {state.incidents
                    .filter((i) => scoped.some((r) => r.id === i.robotId))
                    .map((i) => (
                      <div className="alert-row" key={i.id}>
                        <Activity size={21} />
                        <div>
                          <strong>Sự cố pha chế</strong>
                          <p>{i.message}</p>
                          <p>
                            Robot {i.robotId} · Đơn {i.orderId} · Cần xử lý hoàn
                            tiền, chưa tự khôi phục robot.
                          </p>
                        </div>
                      </div>
                    ))}
                  {alerts
                    .filter((a) => alertTab === "all" || a.kind === alertTab)
                    .map((a) => (
                      <div className="alert-row" key={a.id}>
                        <span className={"alert-symbol " + a.kind}>
                          {a.kind === "error" ? (
                            <Activity size={21} />
                          ) : (
                            <Box size={21} />
                          )}
                        </span>
                        <div>
                          <strong>{a.title}</strong>
                          <button
                            className="text-button alert-location"
                            onClick={() => setSelected(a.robot.id)}
                          >
                            {a.robot.name} · {a.robot.id}{" "}
                            <ArrowUpRight size={13} />
                          </button>
                          <p>{a.detail}</p>
                        </div>
                        {a.kind === "stock" ? (
                          <button
                            className="button"
                            onClick={() => openRefill(a.robot.id, a.index)}
                          >
                            Bổ sung
                          </button>
                        ) : (
                          <button
                            className="button"
                            disabled={ack.includes(a.id)}
                            onClick={() => {
                              setAck([...ack, a.id]);
                              setToast(
                                "Đã tiếp nhận sự cố. Cần kiểm tra robot tại điểm bán.",
                              );
                            }}
                          >
                            {ack.includes(a.id) ? (
                              <>
                                <Check size={16} /> Đã tiếp nhận
                              </>
                            ) : (
                              "Tiếp nhận xử lý"
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  {!alerts.filter(
                    (a) => alertTab === "all" || a.kind === alertTab,
                  ).length && (
                    <div className="empty">
                      <Check /> Không có cảnh báo trong mục này.
                    </div>
                  )}
                </section>
              )}
            </>
          )}
          <footer className="footer">
            <span>© 2026 CukCuk Coffee. Pha kết nối, tạo giá trị.</span>
            <span>
              <span className="live-dot" /> Chế độ mô phỏng{" "}
              <span className="footer-dot">•</span> MVP v1.0
            </span>
          </footer>
        </main>
      </div>
      {refill && (
        <div className="modal-backdrop" onClick={() => setRefill(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="refill-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button close"
              aria-label="Đóng"
              onClick={() => setRefill(null)}
            >
              <X size={20} />
            </button>
            <span className="modal-icon">
              <Box size={25} />
            </span>
            <h2 id="refill-title">Bổ sung nguyên liệu</h2>
            <p>
              {robots.find((r) => r.id === refill.id)?.name} ·{" "}
              {ingredients[refill.index]}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!Number.isFinite(amount) || amount <= 0 || amount > 100)
                  return;
                send({
                  type: "refill",
                  robotId: refill.id,
                  index: refill.index,
                  amount,
                });
                setRefill(null);
                setToast("Đã cập nhật tồn kho nguyên liệu");
              }}
            >
              <label className="field">
                Lượng bổ sung (% sức chứa)
                <input
                  autoFocus
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.valueAsNumber)}
                />
              </label>
              <p className="form-note">
                Tồn kho sau khi bổ sung được giới hạn ở 100%.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => setRefill(null)}
                >
                  Hủy
                </button>
                <button className="button primary" type="submit">
                  <Check size={17} /> Xác nhận bổ sung
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
