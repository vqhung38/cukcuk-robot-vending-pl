import { ChevronRight, Coffee, MapPin } from "lucide-react";
import { money, statusLabel, type Robot } from "../data";
export function RobotTable({
  robots,
  onSelect,
  multiplier = 1,
  showFinance = true,
}: {
  robots: Robot[];
  onSelect: (r: Robot) => void;
  multiplier?: number;
  showFinance?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ROBOT / ĐIỂM BÁN</th>
            <th>TRẠNG THÁI</th>
            {showFinance && (
              <>
                <th>ĐƠN HÀNG</th>
                <th>DOANH THU</th>
              </>
            )}
            <th>NGUYÊN LIỆU</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {robots.map((r) => (
            <tr key={r.id} onClick={() => onSelect(r)}>
              <td>
                <div className="robot-name">
                  <span className="robot-icon">
                    <Coffee size={20} />
                  </span>
                  <div>
                    <strong>{r.name}</strong>
                    <small>
                      {r.id} <span>•</span> {r.city}
                    </small>
                  </div>
                </div>
              </td>
              <td>
                <span className={"badge " + r.status}>
                  <i />
                  {statusLabel[r.status]}
                </span>
              </td>
              {showFinance && (
                <>
                  <td>
                    {(r.orders * multiplier).toLocaleString("vi-VN")}
                    <small>đơn hàng</small>
                  </td>
                  <td>
                    <strong>{money(r.revenue * multiplier)}</strong>
                  </td>
                </>
              )}
              <td>
                <div className="mini-stock">
                  {r.stock.map((v, i) => (
                    <span
                      key={i}
                      style={{
                        background: v < 25 ? "#e8aa41" : "#4c9c7e",
                        height: 16 + v / 3 + "%",
                      }}
                    />
                  ))}
                </div>
                <small>
                  {Math.min(...r.stock) < 25 ? "Cần bổ sung" : "Đủ nguyên liệu"}
                </small>
              </td>
              <td>
                <button
                  className="icon-button"
                  aria-label={"Chi tiết " + r.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(r);
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!robots.length && (
        <div className="empty">
          <MapPin />
          Không tìm thấy robot phù hợp.
        </div>
      )}
    </div>
  );
}
