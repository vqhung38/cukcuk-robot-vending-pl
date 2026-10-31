import { money } from "../data";
export function Chart({ period, base }: { period: string; base: number }) {
  const weights =
    period === "Hôm nay"
      ? [
          12, 8, 5, 4, 6, 17, 32, 43, 36, 29, 48, 62, 49, 41, 37, 51, 68, 83,
          72, 58, 43, 31, 22, 15,
        ]
      : period === "7 ngày qua"
        ? [32, 48, 39, 61, 54, 76, 68]
        : Array.from({ length: 30 }, (_, i) => 30 + ((i * 17) % 47));
  const sum = weights.reduce((a, b) => a + b, 0);
  const values = weights.map((v) => (base * v) / sum);
  const max = Math.ceil(Math.max(...values) / 1000000) * 1000000 || 1000000;
  const labels =
    period === "Hôm nay"
      ? ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:00"]
      : period === "7 ngày qua"
        ? ["Ngày 1", "Ngày 2", "Ngày 3", "Ngày 4", "Ngày 5", "Ngày 6", "Ngày 7"]
        : [
            "Ngày 1",
            "Ngày 5",
            "Ngày 10",
            "Ngày 15",
            "Ngày 20",
            "Ngày 25",
            "Ngày 30",
          ];
  return (
    <div
      className="chart"
      role="img"
      aria-label={"Phân bổ doanh thu mô phỏng: " + money(base)}
    >
      <div className="chart-grid">
        {[1, 0.75, 0.5, 0.25, 0].map((n) => (
          <span key={n}>
            {Number(((max * n) / 1000000).toFixed(1))} tr
            <span />
          </span>
        ))}
      </div>
      <div className="bars">
        {values.map((v, i) => (
          <div className="bar-slot" key={i}>
            <div
              className="bar"
              style={{ height: (v / max) * 100 + "%" }}
              tabIndex={0}
              aria-label={`${period === "Hôm nay" ? i + " giờ" : "Ngày " + (i + 1)}: ${money(Math.round(v))}`}
            >
              <span className="tooltip">{money(Math.round(v))}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="axis">
        {labels.map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
    </div>
  );
}
