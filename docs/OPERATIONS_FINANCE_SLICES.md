# Vertical slices: vận hành robot và doanh thu/đối soát

Phạm vi được triển khai: mock trong React, lưu cùng snapshot `cukcuk-v2`; migration giữ đơn/tồn/sự cố cũ và bổ sung định danh thanh toán/phạm vi còn thiếu. Không kết nối thiết bị, ngân hàng, cổng thanh toán, thông báo hoặc hoàn tiền thật. Mở rộng E2E-07 (SC-07.01/02; PBIs!r54/56–59) và E2E-04 (SC-04.03; PBIs!r37–38), cùng BR01/06/07/14/15/18/20. Chưa nghiệm thu toàn bộ scenario của workbook.

## 1. Nguồn dữ liệu và tính nhất quán

- `sales.ts`: đơn, từng ly, BOM, giữ chỗ và tiêu hao; `platform.ts`: ticket, lịch sử, refund, giao dịch nguồn, sao kê mẫu và kỳ đối soát; `access.ts`: scope, capability và projection theo hồ sơ demo.
- `execute` kiểm quyền và scope trên mọi lệnh từ UI, kể cả dùng ID trực tiếp. Các component không tự cộng/trừ tiền hoặc đổi robot. Dữ liệu được lọc trước khi vào component/CSV; đơn giữ snapshot tenant/chain/site và mã payment ổn định.
- `financeMetrics`, `aggregateFinance` và `transactions` dùng cùng giao dịch nguồn cho dashboard, báo cáo, nhóm robot/site/chain và CSV. Không copy bộ đếm “đã đối soát” vào Order.
- Một điểm bán có nhiều robot: RB-001/002 thuộc hcm-1; RB-003/004/007 thuộc hcm-2; RB-005/006 thuộc hn; RB-008 thuộc dn. Miền Nam/Bắc/Trung là ba chuỗi demo trong tenant-a. Mapping này là fixture giả, không suy luận địa điểm thực từ tên robot. Đơn cũ chưa có scope được gắn mapping này khi tải.
- Nền lịch sử demo cũ vẫn hiển thị riêng với nhãn minh họa ở dashboard/bảng robot; không tạo payment/sao kê giả cho con số nền đó. Khối tài chính mới chỉ tổng hợp đơn thực sự tạo trong simulator.

## 2. Quyền demo

| Hồ sơ | Phạm vi đọc | Thao tác |
| --- | --- | --- |
| Chain Manager mặc định | Ba chuỗi demo được giao trong tenant-a | Mua hàng simulator, refill, phát sự cố/mở phiếu/gán/tiến độ/khôi phục; đọc tài chính trong scope, không refund/chốt |
| Chain Manager Miền Nam | Chỉ south (RB-001/002/003/004/007) | Cùng capability Manager, từ chối cả ID trực tiếp của robot/đơn/phiếu ngoài phạm vi |
| Provider Operations | Robot, tồn vật lý, sự cố, phiếu, lịch sử vận hành trong tenant-a được giao | Xử lý vận hành; không đọc số tiền/đơn tài chính/batch/refund, không xuất CSV tài chính hoặc thực hiện refund/chốt |
| Business Owner | Các chuỗi/pháp nhân demo trong tenant-a, tài chính và lịch sử liên quan | Đọc vận hành, mô phỏng refund, tạo/sửa sao kê mẫu/chốt đối soát; không đổi kết quả mua hàng/refill/khôi phục robot |

Business Owner được quyền thực hiện các mô phỏng tài chính trong slice này là **giả định demo**, không xác nhận thẩm quyền kế toán hoặc thay thế phân tách lập/duyệt. Bộ chọn “Vai trò demo” không phải đăng nhập. Bản hiện tại chưa có backend, quyền không ngăn người có quyền sửa JS/localStorage; production cần kiểm lại toàn bộ trên server. Không dùng dữ liệu thật.

## 3. Slice vận hành

1. Vào **Vận hành robot**, chọn robot, lỗi/offline và mô tả; **Phát sinh sự cố** ghi Incident, đổi robot sang trạng thái chặn bán và ghi lịch sử actor/thời gian/trước-sau.
2. Cảnh báo liên kết Incident; **Mở phiếu xử lý** chỉ tạo tối đa một ticket/incident. Lỗi pha từ trang khách mua hàng cũng xuất hiện ở đây, không cần tạo lại.
3. **Gán người phụ trách**, **Cập nhật tiến độ** (1–99%, không lùi, có ghi chú), rồi điền kết quả và xác nhận kiểm tra kết nối/pha thử đạt.
4. **Ghi kết quả và khôi phục** chỉ hợp lệ khi đã phân công, đang xử lý, có kết quả/bằng chứng xác nhận và không còn đơn đang pha. Phiếu thành resolved/100%; robot chỉ online khi mọi incident của nó đã giải quyết. Thao tác lặp không khôi phục hoặc tạo lịch sử kết thúc lần hai.
5. Lịch sử được lưu qua reload. Khôi phục không đổi đơn lỗi thành hoàn tất, không xóa nghĩa vụ hoàn tiền, không trừ tồn thêm. Các ly đã bắt đầu vẫn xác nhận kết quả độc lập như slice mua hàng trước.

Chưa có tự phát hiện telemetry thật, nhận việc theo tài khoản nhân viên, SLA/escalation tự động, ảnh/bằng chứng thiết bị, reopen hoặc điều khiển từ xa/OTA thật. Hai người nhận việc là danh mục giả ops-1/ops-2. “Tiếp nhận xử lý” ở cảnh báo cũ vẫn chỉ là acknowledgement UI cũ, không thay workflow phiếu có lưu lịch sử.

## 4. Slice tài chính

### Định nghĩa trong demo

| Chỉ tiêu | Nguồn / cách tính |
| --- | --- |
| Giá trị đơn | Tổng giá snapshot × số lượng của mọi đơn tạo trong kỳ; bao gồm đơn chờ/failed, không phải doanh thu |
| Doanh thu phục vụ thành công | Giá các ly đã pha thành công theo thời gian kết quả; ly lỗi/chờ không tính |
| Giao dịch thu thành công | Capture thành công theo paidAt; có thể đã trả tiền nhưng chưa phục vụ/lỗi |
| Hoàn thành công | Tổng Refund succeeded theo finishedAt; requested/processing/failed không trừ tiền |
| Thu ròng | Capture succeeded − Refund succeeded; có thể âm trong kỳ hoàn đơn cũ |
| Còn cần hoàn | Nghĩa vụ hoàn các ly lỗi trừ các refund thành công, mọi kỳ trong scope; không nhầm với chi tiền trong kỳ |
| Đã đối soát | Tổng có dấu của transaction capture/refund trong batch đã closed; từng dòng phải khớp và received=true. Hiển thị theo ngày nghiệp vụ giao dịch gốc, không theo ngày chốt |

Kỳ báo cáo giờ Việt Nam, lưu UTC; `[start, end)`; VND số nguyên. Đây chưa phải chính sách ghi nhận doanh thu kế toán được doanh nghiệp chấp thuận. Hoàn ly lỗi không trừ doanh thu lần hai vì ly đó chưa từng ghi doanh thu trong demo.

### Payment / refund

- Payment có ID liên kết Order; pending → unknown khi phản hồi chậm, sau đó xác minh succeeded/failed. Unknown không được pha hoặc sinh capture. Kết quả succeeded/failed đã kết thúc không bị ghi đè bởi thao tác trái ngược; callback lặp không tạo thêm capture.
- Mỗi refund gắn payment/đơn, số tiền không vượt phần còn được hoàn do ly lỗi. requested → processing → succeeded/failed; failed → processing để retry cùng yêu cầu. Chỉ succeeded tạo giao dịch âm; không cho song song hai yêu cầu chưa kết thúc hoặc refund ly tốt.
- Nếu thêm ly lỗi sau khi đã hoàn một phần trước đó, có thể tạo yêu cầu mới cho đúng phần còn thiếu. Phiếu khôi phục robot không tự hoàn tiền.

### Kỳ / chênh lệch

- Owner chọn Site, ngày và loại sao kê mẫu: khớp, thiếu, sai tiền, trùng hoặc chưa xác nhận tiền. Dòng sao kê sinh từ fixture mô phỏng, **không phải nguồn độc lập từ ngân hàng**.
- Matching theo transaction ID/loại có dấu/phạm vi, không chỉ tổng ngày. Mọi trạng thái khác matched đều chặn chốt, kể cả tổng tiền bằng nhau nhưng một capture/refund bị thiếu/trùng.
- Sửa sao kê mẫu cần lý do, số nguyên và xác nhận received rõ ràng; sửa/gộp dòng sao kê không sửa giao dịch nguồn. Audit lưu actor, entity, trước/sau trạng thái và lý do.
- Chỉ **Chốt kỳ đối soát** mới cộng tiền đối soát. Batch review khớp đủ cũng chưa được coi đã nhận tiền. “Chốt” trong demo không phải payout thật.
- Batch closed bất biến; thao tác close lặp không cộng hai lần. Batch đang review sẽ phát hiện giao dịch mới trong kỳ, chặn chốt nếu chưa có sao kê tương ứng.
- Khi capture/refund mới đến sau chốt, tạo lại **đúng biên ngày cũ** sinh batch bổ sung tham chiếu batch đầu, chỉ lấy transaction chưa từng chốt. Không sửa snapshot cũ, không tính lại capture cũ. Kỳ đang mở hoặc khoảng chồng lấn khác biên bị chặn.

Chưa có phí/thuế/hoa hồng, chargeback, đối soát HĐĐT thật/ba bên hoàn chỉnh, công cụ import sao kê độc lập, payout, chia tiền, nhiều tiền tệ hoặc chứng từ điều chỉnh kế toán chính thức. Chưa hỗ trợ tình huống late success sau payment failed (đưa ngoại lệ production thay vì bỏ capture thật), timeout refund không xác định, refund ly tốt vì khiếu nại hay quyền lợi ngoài lỗi pha.

## 5. Quy tắc cần doanh nghiệp xác nhận trước production

1. **Chủ thể nhận tiền:** tài khoản thuộc pháp nhân nào, Provider hay B2B là merchant of record; mapping tenant–pháp nhân–chuỗi–điểm–robot, quyền xem chéo và ủy quyền hỗ trợ.
2. **Ghi nhận doanh thu:** lúc capture, pha, giao hay khách nhận; giá gồm/chưa VAT, loại thuế và làm tròn; ưu đãi phân bổ từng ly; doanh thu gộp/thuần, xử lý hủy/partial fulfillment/hoàn kỳ trước và hóa đơn điều chỉnh.
3. **Chính sách hoàn:** ai yêu cầu/duyệt/thực hiện, hạn mức và thời hạn; tự động hay hai người kiểm soát; hoàn phần, phí hoàn, pha bù/voucher, capture thành công muộn, unknown/refund timeout, retry idempotency và tranh chấp/chargeback.
4. **Thế nào là tiền đã nhận:** nguồn chứng minh PSP vs sao kê ngân hàng vs payout; gross/net và phí/hoa hồng/thuế khấu trừ; lịch T+n, cutoff/timezone/ngày nghỉ, pending settlement và cách xử lý tiền về khác ngày.
5. **Đối soát và khóa sổ:** khóa ghép, sai số cho phép, thẩm quyền giải thích chênh lệch/tất toán/chốt/mở lại; version/bổ sung/điều chỉnh sau chốt, giao dịch đến muộn, kiểm toán bất biến và thời gian lưu.
6. **P&L/giá vốn:** phương pháp giá nguyên liệu, pha hỏng/test drink/vệ sinh/hao hụt, phân bổ phí/nhân công/khấu hao, cách xử lý dữ liệu chi phí thiếu. Slice này chưa tính lợi nhuận.
7. **Kiểm soát sản xuất:** kiểm quyền phía server, tách nhiệm vụ lập–duyệt–chi, bảo vệ PII/payment reference, log/audit, khóa cạnh tranh nhiều người/tab và hợp đồng sự kiện với ngân hàng/robot. Mock localStorage không đủ cho giao dịch thật.

## 6. Test và cách demo

```sh
npm run build
npm test
# Chạy Vite trước trên cổng 5173:
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node tests/browser.cjs
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node tests/customer-browser.cjs
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node tests/platform-browser.cjs
```

- `platform.test.ts`: state machine operations/refund/reconciliation, chống trùng, nhiều incident, khôi phục an toàn, scope, tổng hợp robot/site/chain, batch bổ sung và không tự nhận tiền.
- `PlatformFlow.test.tsx`: UI lifecycle, persistence, role switching, refund retry, chênh lệch và scoped CSV.
- `platform-browser.cjs`: mua lỗi → ticket/khôi phục, refund fail/retry → sửa sao kê/chốt, quyền/CSV và responsive. Chạy cùng toàn bộ test mua hàng/hồi quy cũ.

Demo nhanh: tạo đơn cà phê sữa lỗi một ly → đổi Provider mở/gán/xử lý phiếu và khôi phục → đổi Owner vào Đối soát → tạo yêu cầu hoàn, thử fail/retry/success → tạo kỳ thiếu sao kê, sửa đúng dòng kèm xác nhận → chốt. Quay Tổng quan/Báo cáo và đổi nhóm robot/điểm/chuỗi. Chọn Manager Miền Nam để kiểm tra RB-005/006/008 và dữ liệu liên quan không xuất hiện; Provider không có trang/CSV tài chính.

### Kết quả kiểm chứng tại thời điểm bàn giao

- `npm run build`: TypeScript + Vite đạt.
- `npm test`: 65 passed, 0 failed, 5 test files (gồm toàn bộ regression cũ).
- Ba script Chromium: 1 luồng regression + 4 nhánh mua hàng + 3 luồng operations/finance/role = 8 passed, 0 failed; không có page errors. Có kiểm tra bố cục 1024/390px, reload, số liệu và CSV.
- Đây là kết quả mock trên môi trường hiện tại, không phải nghiệm thu production hoặc toàn bộ workbook.
