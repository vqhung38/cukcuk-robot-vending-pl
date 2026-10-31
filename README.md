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
- Tồn kho, đơn mua và sự cố lưu chung trong localStorage (`cukcuk-v2`); có migration dữ liệu tồn từ `cukcuk-v1`. Xem hướng dẫn reset demo ở cuối tài liệu.

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

## Demo khách mua cà phê (E2E-02)

Sau `npm ci`, chạy `npm run dev -- --port 5173 --strictPort` và mở ứng dụng qua cổng 5173.

1. Vào **Khách mua cà phê**, chọn robot online, đồ uống và số lượng (1–20 ly/một loại đồ uống mỗi đơn).
2. Chọn **Tạo đơn hàng**. Xem tồn thực, khả dụng và lượng cần; nguyên liệu được giữ chỗ, chưa trừ tồn thực.
3. Chọn **Thanh toán thành công** hoặc **Thanh toán thất bại**. Đơn thất bại không được pha, không tính doanh thu và giải phóng giữ chỗ.
4. Với đơn đã trả tiền, chọn **Bắt đầu pha chế**, rồi chọn kết quả cho từng ly. Ví dụ ba ly: ly 1 thành công, ly 2 lỗi, ly 3 thành công.
5. Xem **Đơn hàng**, **Tổng quan**, **Tồn kho nguyên liệu**, **Cảnh báo**, **Báo cáo** và **Xuất báo cáo**. Ly tốt có doanh thu/tiêu hao đúng một lần; ly lỗi sinh sự cố và khoản cần hoàn, không được ghi là hoàn tất.
6. Tải lại trang rồi vào **Đơn hàng** để tiếp tục đơn đang chờ hoặc kiểm tra kết quả đã lưu.

Thử chặn tồn: chọn RB-002 (Bitexco), Latte × 4; cần 20% sữa nhưng chỉ có 18% (nếu chưa bổ sung), nên không tạo được đơn. Robot offline/error không chọn được và lớp nghiệp vụ cũng chặn nhận đơn.

### Kiểm thử

```sh
npm run build
npm test
# Chạy Vite trước; module Chromium/Playwright sẵn có trong cloud:
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node tests/customer-browser.cjs
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node tests/browser.cjs
```

Test mới bao phủ transition, offline/error, tồn không đủ/đúng ngưỡng, giữ chỗ giữa nhiều đơn, payment lỗi, chặn pha trước thu tiền, kết quả từng ly, thao tác/callback lặp, sự cố/cần hoàn, kỳ báo cáo, migration và reload; Chromium kiểm bốn nhánh cùng CSV và bố cục 1024/390px.

### Giả định và giới hạn của lát cắt hiện tại

- BOM giả dùng **điểm phần trăm sức chứa**, không phải gram/ml: đen `[2,0,1,1]`, sữa `[2,3,1,1]`, latte `[2,5,1,1]` theo thứ tự cà phê/sữa/siro/ly. Giá lần lượt 30.000/35.000/45.000 VND. Chưa tính thuế, ưu đãi, COGS hoặc hóa đơn.
- Doanh thu demo ghi nhận theo **ly pha thành công**, coi như đã giao; đơn chỉ hoàn tất khi mọi ly thành công. Đơn một phần có doanh thu ly tốt nhưng không tăng số đơn hoàn tất. Tiền đã thu và khoản cần hoàn hiển thị riêng; chưa tự thực hiện hoàn tiền.
- Ly lỗi không trừ tồn trong lát cắt này; hao hụt thực tế cần quy tắc bổ sung. Robot được đánh dấu error để chặn đơn mới; kết quả các ly đã bắt đầu trong cùng lượt mô phỏng vẫn có thể xác nhận riêng. Chưa có UI sửa lỗi/khôi phục robot.
- Mỗi robot chỉ bắt đầu một đơn tại một thời điểm. Giữ chỗ từ lúc tạo đơn đến khi có kết quả payment/pha; chưa có hủy/TTL tự giải phóng, retry payment, rebrew/voucher hoặc timeout/unknown. Có thể tiếp tục đơn còn mở qua mục Đơn hàng.
- `cukcuk-v2` lưu **một snapshot** robot/đơn/sự cố trong localStorage; lần đầu nhập tồn từ `cukcuk-v1`, không cập nhật lại khóa v1. Không hỗ trợ đồng bộ nhiều tab/người dùng, backend, phân quyền production hoặc chống sửa localStorage. Dữ liệu không hợp lệ khôi phục fixture demo; không dùng làm sổ cái thật.
- Đơn mới lọc theo thời gian phát sinh giờ Việt Nam và chỉ cộng một lần ở kỳ 1/7/30 ngày. Nền lịch sử cũ vẫn là tổng minh họa (nhân ngày theo kỳ); biểu đồ phân bổ minh họa, không phải lịch sử giao dịch thật. Báo cáo có khối riêng chỉ tính đơn mua mô phỏng, CSV tách cột tiền thu/cần hoàn/doanh thu đơn mới.
- Chưa có giỏ nhiều loại đồ uống trong một đơn, tích hợp robot/thanh toán/HĐĐT/ZNS thật, nhận ly bằng cảm biến, tồn lô/HSD, đối soát ngân hàng/P&L hoặc các luồng nền tảng còn lại. Đây là lát cắt mô phỏng, không nghiệm thu toàn bộ SC-02.01…04.

Để chạy demo sạch, dùng phiên trình duyệt riêng mới; hoặc chủ động xóa **cả** `cukcuk-v2` và `cukcuk-v1` trong bộ nhớ trang rồi tải lại (xóa toàn bộ đơn/tồn demo đã lưu).
