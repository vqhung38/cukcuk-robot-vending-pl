import { useEffect, useState } from "react";
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
import {
  getAlerts,
  ingredients,
  initialRobots,
  money,
  statusLabel,
  type Robot,
} from "./data";
import { Chart } from "./components/Chart";
import { RobotTable } from "./components/RobotTable";
import { Stat, PanelHeading, StockRow } from "./components/ui";
type Page = "Tổng quan" | "Quản lý robot" | "Tồn kho nguyên liệu" | "Cảnh báo";
function readRobots(): Robot[] {
  try {
    const value = JSON.parse(localStorage.getItem("cukcuk-v1") || "null");
    if (
      Array.isArray(value) &&
      value.length === initialRobots.length &&
      value.every(
        (r: Robot) =>
          initialRobots.some((s) => s.id === r.id) &&
          Array.isArray(r.stock) &&
          r.stock.length === 4 &&
          r.stock.every((v) => typeof v === "number" && v >= 0 && v <= 100) &&
          ["online", "offline", "error"].includes(r.status),
      )
    )
      return value;
  } catch {}
  return initialRobots;
}
export default function App() {
  const [robots, setRobots] = useState<Robot[]>(readRobots);
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
    localStorage.setItem("cukcuk-v1", JSON.stringify(robots));
  }, [robots]);
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
  const revenue = scoped.reduce((a, r) => a + r.revenue, 0) * multiplier;
  const orders = scoped.reduce((a, r) => a + r.orders, 0) * multiplier;
  const robot = robots.find((r) => r.id === selected);
  const navigate = (p: Page) => {
    setPage(p);
    setSelected(null);
    setQuery("");
    setStatus("all");
  };
  function exportCsv() {
    const rows = [
      ["Robot", "Điểm bán", "Khu vực", "Trạng thái", "Đơn hàng", "Doanh thu"],
      ...visible.map((r) => [
        r.id,
        r.name,
        r.city,
        statusLabel[r.status],
        r.orders * multiplier,
        r.revenue * multiplier,
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
                  value={money(robot.revenue * multiplier)}
                  icon={<Wallet size={20} />}
                  note={period}
                />
                <Stat
                  title="Đơn hàng thành công"
                  value={(robot.orders * multiplier).toLocaleString("vi-VN")}
                  icon={<ShoppingBag size={20} />}
                  note={period}
                />
                <Stat
                  title="Giá trị trung bình / đơn"
                  value={money(robot.revenue / robot.orders)}
                  icon={<Coffee size={20} />}
                  note="Theo dữ liệu mô phỏng"
                />
              </div>
              <section className="panel">
                <PanelHeading
                  title="Doanh thu theo thời gian"
                  subtitle="Đơn vị: triệu đồng"
                />
                <Chart period={period} base={robot.revenue * multiplier} />
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
                    robots={visible}
                    onSelect={(r) => setSelected(r.id)}
                    multiplier={multiplier}
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
                setRobots(
                  robots.map((r) =>
                    r.id === refill.id
                      ? {
                          ...r,
                          stock: r.stock.map((v, i) =>
                            i === refill.index ? Math.min(100, v + amount) : v,
                          ),
                        }
                      : r,
                  ),
                );
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
