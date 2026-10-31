# CukCuk — Robot Coffee Operations

MVP React 19 + TypeScript + Vite cho quản lý chuỗi robot cà phê. Dùng dữ liệu mẫu của 8 robot tại 3 khu vực, không cần API key hoặc backend.

## Chạy ứng dụng

Node.js 22+ (đã kiểm tra với 24.19.0), npm 11.

```sh
cd /workspace/cukcuk-robot-vending-pl
npm ci
npm run dev -- --port 5173
```

Mở cổng 5173 bằng công cụ phát triển trên máy của bạn. Build production: `npm run build`. Kiểm thử: `npm test`.

## Chức năng

- Dashboard tổng doanh thu, đơn hàng, robot hoạt động và cảnh báo.
- Bộ lọc khu vực, kỳ báo cáo, trạng thái, tìm kiếm tên/mã robot; trạng thái rỗng.
- Nhấn robot hoặc nút mũi tên để xem doanh thu và tồn kho chi tiết.
- Tồn kho bốn nguyên liệu; bổ sung 1–100% sức chứa bằng hộp thoại. Giá trị tối đa sau bổ sung là 100%.
- Cảnh báo tự sinh khi tồn kho dưới 25%, robot lỗi hoặc offline. Bổ sung nguyên liệu tự xóa cảnh báo nếu đạt ngưỡng. Tiếp nhận sự cố không tự đánh dấu robot đã được sửa.
- Xuất CSV theo bộ lọc bảng robot, khu vực và kỳ báo cáo hiện tại.
- Tồn kho được lưu trong localStorage (`cukcuk-v1`); xóa khóa để phục hồi dữ liệu mẫu.

## Cấu trúc

- `src/App.tsx`: điều phối các màn hình và trạng thái ứng dụng.
- `src/data.ts`: kiểu dữ liệu, dữ liệu mẫu, định dạng và quy tắc cảnh báo.
- `src/components/Chart.tsx`: biểu đồ cột và tooltip.
- `src/components/RobotTable.tsx`: bảng robot dùng lại.
- `src/components/ui.tsx`: thẻ chỉ số, tiêu đề panel và thanh tồn kho.
- `src/styles.css`: giao diện desktop và bố cục thích ứng.
- `src/App.test.tsx`: kiểm thử tương tác React.
- `tests/browser.cjs`: kiểm thử xuyên luồng bằng Playwright + Chromium.

## Kiểm thử trình duyệt

Cần Playwright và Chromium. Trong môi trường cloud hiện tại:

```sh
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node tests/browser.cjs
```

Chạy Vite trước. Trên máy khác, cài Playwright riêng hoặc đặt `PLAYWRIGHT_MODULE` đến module đã cài và `CHROMIUM_PATH` đến Chromium. Script dùng session trình duyệt mới và kiểm tra điều hướng, tìm kiếm, chi tiết robot, bổ sung, lưu sau reload, cảnh báo, tải CSV, lọc khu vực, bố cục 1024px và lỗi JavaScript. Ảnh dashboard được ghi tại `/tmp/cukcuk-dashboard.png`.

## Giới hạn MVP

- Doanh thu 7/30 ngày được mô phỏng bằng doanh thu ngày nhân số ngày; các cột biểu đồ là phân bổ minh họa có tổng khớp kỳ báo cáo, không phải lịch sử giao dịch thật.
- Chưa có đăng nhập, phân quyền theo chủ điểm bán, backend, đồng bộ nhiều thiết bị hoặc telemetry robot.
- Tiếp nhận cảnh báo chỉ tồn tại trong phiên React; xử lý lỗi robot thực tế cần tích hợp backend và quy trình kỹ thuật.
- localStorage không cung cấp cơ chế đồng bộ/kiểm soát xung đột nhiều tab. Không sử dụng cho dữ liệu vận hành thật.
- Xuất CSV là báo cáo bảng robot, không phải báo cáo giao dịch kế toán.

## Môi trường cloud

Dùng checkout sẵn có; mỗi task đã được cô lập, không cần tạo Git worktree. Phụ thuộc được khóa trong `package-lock.json`. Cài đặt qua proxy và CA của nền tảng, giữ xác minh TLS. Nếu sandbox hạn chế mạng hoặc mở cổng, dùng cơ chế cấp quyền thực thi của nền tảng; không tắt proxy/TLS. Các tiến trình Vite cần khởi động lại trong task mới.
