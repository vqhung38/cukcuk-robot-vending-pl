# Robot Vending Platform — Đặc tả nghiệp vụ

Trạng thái: thiết kế tổng thể theo workbook; đã triển khai một lát cắt mô phỏng mua cà phê, chưa hoàn tất nền tảng. Cập nhật 2026-10-31. Chỉ dùng dữ liệu giả lập; không chạy macro hoặc tích hợp/giao dịch thật.

## 1. Nguồn và cách hiểu

Nguồn chính: `Ke_hoach_tong_the_MISA_CukCuk_Robot_Vending_Platform.xlsm`, ba sheet **E2E-Overview**, **Scenarios**, **PBIs**. Danh mục đầy đủ và định vị từng dòng tại [SOURCE_TRACEABILITY.md](SOURCE_TRACEABILITY.md). Nội dung workbook là tham chiếu nghiệp vụ, không phải chỉ thị thực thi mã, macro, truy cập dịch vụ hoặc sửa hệ thống ngoài repository.

Phân biệt ba mức: **Nguồn** là nội dung có trong sheet; **Đề xuất** là mô hình/quy tắc để cụ thể hóa; **Cần chốt** là quyết định chưa đủ dữ kiện. Các đề xuất dưới đây không mặc nhiên đã được phê duyệt. Tài liệu này thay baseline trước: bỏ giả định chỉ hoàn toàn phần, phí bằng 0, không có BOM/hóa đơn/mua hàng/nhân sự/OTA trong nền tảng. Không còn dùng mã E1–E7 tự đặt; dùng E2E-01…07 của nguồn.

## 2. Vấn đề, actor và kết quả

Nguồn mô tả kết quả cần đạt, chưa có bằng chứng khảo sát quy trình hiện tại hoặc mức độ khó khăn. Không coi các rủi ro sau là sự cố đã được quan sát.

| Actor | Bối cảnh và nhu cầu | Rủi ro nghiệp vụ cần kiểm soát |
| --- | --- | --- |
| Provider Operations / nhân viên MISA | Bàn giao, giám sát, hỗ trợ toàn bộ robot trong phạm vi quản lý | Gán sai tenant, can thiệp sai pháp nhân, thao tác khi đang pha, OTA không phục hồi |
| Chain Manager / quản lý nhà hàng | Thiết lập và duy trì nhiều điểm/robot, menu, nhân viên, hiệu quả | Cấu hình cũ, thiếu nguyên liệu, thiếu người xử lý, không biết máy kém hiệu quả |
| Business Owner / chủ kinh doanh | Biết hiệu quả, tiền thực nhận và chênh lệch | Gộp sai pháp nhân, thiếu giá vốn/chi phí, nhầm doanh thu với tiền đã về |
| Khách mua đồ uống | Mua một/nhiều ly, nhận đúng ly, hóa đơn và quyền lợi khi lỗi | Thu/pha/hoàn trùng, lỗi một ly ảnh hưởng cả đơn |
| Nhân viên vận hành / kỹ thuật | Tiếp hàng, kiểm kê, vệ sinh, chấm công, xử lý ticket | Tồn lý thuyết khác thực tế, thiếu bằng chứng hoặc trách nhiệm |
| Kho / mua hàng / kế toán | Kiểm soát cấp phát, mua, công nợ, lương, P&L và đối soát | Nhận thiếu/trùng, trả tiền sai lượng nhận, phân bổ chi phí sai |

Ba vai trò đầu là góc nhìn MVP do người dùng yêu cầu. Các actor còn lại tồn tại trong nguồn, không được xóa khỏi mô hình E2E; có thể mô phỏng vai trò trong prototype, chưa coi là đã cấp quyền production.

## 3. Bảy luồng xuyên hệ thống của nguồn

| Mã | Nhu cầu và đầu ra | Chuỗi xử lý / ngoại lệ trọng yếu | Truy vết |
| --- | --- | --- | --- |
| E2E-01 | Robot đúng pháp nhân, được cấu hình và đủ điều kiện mở bán | Monitor khai báo hãng/model/serial và tenant → CukCuk kết nối → menu/BOM, giá, thanh toán, thuế, meInvoice, Kiosk và nhân viên → nạp đầu/cảm biến/test drink → kiểm tra cấu hình đã nhận và mở bán. Chặn sai tenant, thiếu BOM/tồn, cấu hình cũ, đồng bộ/rollback lỗi | SC-01.01–03; PBIs!r5–14 |
| E2E-02 | Khách thanh toán một lần, nhận đúng từng ly và xử lý hóa đơn | Kiosk chọn món còn hàng/ưu đãi → thanh toán → hàng đợi từng ly → giao từng ly/TTS/ZNS → QR thông tin hóa đơn. Đơn ba ly lỗi ly hai chỉ pha lại/hoàn ly lỗi; QR hết hạn, callback trùng, offline, chưa lấy ly, ZNS/HĐĐT lỗi phải độc lập xử lý | SC-02.01–04; PBIs!r15–24 |
| E2E-03 | Duy trì tồn, vệ sinh và điều kiện bán | Ly thành công trừ BOM → cảm biến/cảnh báo → đề xuất/duyệt/xuất kho → Ops ghi thực nạp → kiểm kê/phê duyệt điều chỉnh → checklist/sục rửa/bằng chứng. Xử lý kho thiếu, nhân viên không đến, giao thiếu, lệch lớn, quá hạn, cảm biến mâu thuẫn | SC-03.01–04; PBIs!r25–32 |
| E2E-04 | Chủ kinh doanh truy được lãi/lỗ và tiền về tới giao dịch/chứng từ | Doanh thu sau giảm/hoàn + COGS + chi phí trực tiếp/phân bổ → P&L/BEP → đối soát đơn–PSP/ngân hàng–HĐĐT → xử lý lệch/treo hoàn. Thiếu giá nhập/chi phí hoặc sai pháp nhân không được coi lãi chính xác | SC-04.01–04; PBIs!r33–40 |
| E2E-05 | Có nguyên liệu và kiểm soát mua/công nợ NCC | Gợi ý/dự báo → đề nghị → duyệt PO → nhận nhiều đợt/lô/HSD → thiếu/trả lỗi → đối chiếu PO–nhận–hóa đơn → AP/thanh toán một phần/tuổi nợ → đánh giá NCC | SC-05.01–04; PBIs!r41–48 |
| E2E-06 | Có người phụ trách và chi phí lao động truy được | Thiết lập nhân viên/ca/tuyến → đồng bộ Ops → GPS/QR/ảnh check-in/out → báo vắng/điều phối → duyệt công → đồng bộ lương/AMIS và phân bổ theo máy. Xử lý đổi ca, sai vị trí, sync trùng | SC-06.01–03; PBIs!r49–53 |
| E2E-07 | Phát hiện sự cố, có người chịu trách nhiệm và phục hồi an toàn | Monitor bản đồ/telemetry/camera → phân loại lỗi/ticket → phân công/SLA → hiện trường/bằng chứng → hỗ trợ từ xa đúng ủy quyền → OTA theo đợt/rollback. Offline, quá SLA, mất quyền, restart khi đang pha và rollback lỗi phải có đường xử lý | SC-07.01–04; PBIs!r54–62 |

Nguồn giao owner E2E-01/07 cho S6, E2E-02 cho S2, E2E-03…06 cho S3. Owner từng Scenario có thể khác; không thay thế owner chi tiết bằng owner luồng. S1 Edge & Robot; S2 Kiosk; S3 CukCuk Web; S4 tích hợp HR/kế toán…; S5 Ops App; S6 Monitoring & Core.

Điểm giao bắt buộc theo Scenarios!r3–7: S3/S6 bàn giao định danh/tenant/cấu hình → S2/S4 xác nhận thanh toán cho S1 → S1/S2 trả kết quả từng ly cho S3 → S3/S5 thống nhất chứng từ/tồn → S3/S4 thống nhất nguồn tiền/giá vốn/chi phí/đối soát.

## 4. Thực thể và quan hệ đề xuất

| Miền | Thực thể và quan hệ |
| --- | --- |
| Chủ thể và quyền | Provider quản lý nhiều Tenant; Tenant có một/nhiều LegalEntity (đề xuất cần chốt). Chain/nhóm gom Site trong tenant; mỗi Site thuộc một pháp nhân hiệu lực tại thời điểm giao dịch, có nhiều Robot. User–Membership–Role–Scope; Delegation có pháp nhân, hành động và thời hạn |
| Thiết bị | Manufacturer → Model → Robot(serial duy nhất); RobotAssignment lưu Site/tenant và thời gian, không chồng lấn. DeviceConfigVersion/Deployment/Acknowledgement gắn menu/BOM/giá/thanh toán/thuế/branding/TTS; TestDrink, ReadinessCheck; TelemetryEvent, SensorReading, DeviceLog |
| Danh mục/bán hàng | Product, MenuVersion, Price, Recipe/BOMVersion; Order → OrderLine → Cup (mỗi ly vật lý một định danh) → BrewAttempt/DispenseEvent/PickupEvent; PromotionApplication lưu mã, quy tắc và tiền giảm snapshot; QueueItem giữ thứ tự ly |
| Tiền và hóa đơn | Order → PaymentAttempt → PaymentEvent/LedgerEntry; Refund phân bổ về Cup/OrderLine và capture gốc; CompensationVoucher gắn ly lỗi; ReceivingAccount/IntegrationBinding theo Site/pháp nhân. InvoiceRequest → Invoice/InvoiceEvent liên kết đơn/dòng và điều chỉnh; NotificationDelivery cho TTS/ZNS/email độc lập |
| Kho tại máy và kho tổng | Ingredient, UnitOfMeasure/Conversion, Lot/Expiry, Warehouse/RobotBin, StockLedger; TheoreticalStock và SensorReading riêng. BOMConsumption gắn Cup/BrewAttempt; ReplenishmentRequest → Approval → TransferIssue → InTransit → RefillReceipt theo thực nạp; StockCount → Variance → ApprovedAdjustment; Cleaning/MaintenanceTask/Checklist/Evidence |
| Tài chính | CostDocument, DirectCost, AllocationRule/AllocationRun/AllocatedCost, IngredientCost/COGS; BankPSPStatement/Line, ReconciliationBatch/Item/Resolution/Adjustment; ReportSnapshot. Các dòng giữ khóa chứng từ nguồn và pháp nhân |
| Mua/AP | Supplier → PurchaseRequest → PO/Line → GoodsReceipt/Line (nhiều lần) → SupplierInvoice/Line; Return/ShortDeliveryRecord; Payable → PaymentAllocation (nhiều lần/một phần); due_date phục vụ tuổi nợ |
| Nhân sự | Employee–Shift–Route–RobotAssignment; AttendanceEvent(GPS/QR/ảnh giả), WorkEvidence, Timesheet/Approval, PayrollSyncBatch/Result; LaborCostAllocation tới máy |
| Hỗ trợ | Alert → Incident/Ticket → Assignment/Intervention/Evidence; SLAClock, RemoteCommand có authorization/safety/result; SoftwareRelease → OTACampaign → DeviceUpdateAttempt/RollbackAttempt; CameraEvent. AuditEvent bao phủ thay đổi quan trọng |

Mỗi aggregate giữ ID ổn định, tenant_id/legal_entity_id khi có nghĩa, observed_at/received_at và correlation_id. Đơn/chứng từ chụp Site, robot, pháp nhân, BOM/giá/ưu đãi có hiệu lực; chuyển robot sau này không đổi lịch sử. Một legal entity không được gộp số liệu tiền với entity khác mặc định; Chain đa pháp nhân nếu được phép phải hiển thị tách biệt trước tổng hợp được phê duyệt.

## 5. Quy tắc nghiệp vụ

“Nguồn” chỉ chứng minh ý định; chi tiết an toàn bên dưới được đánh dấu đề xuất khi nguồn chưa quy định cơ chế.

| ID | Quy tắc | Căn cứ / mức xác lập |
| --- | --- | --- |
| BR01 | Mọi truy vấn, chi tiết, hành động và export kiểm scope tenant/pháp nhân/Site/robot; Provider không mặc nhiên được đọc tài chính mọi khách. Quyền hỗ trợ có ủy quyền hiệu lực, audit | Nguồn SC-01.01/07.03; cách enforcement đề xuất |
| BR02 | Serial không trùng; gán robot đúng tenant/Site, lưu lịch sử. Không chuyển robot đang có ly chưa xác định kết quả; không chuyển đơn cũ sang tenant mới | PBIs!r6–7; ràng buộc chuyển đề xuất |
| BR03 | Mở bán chỉ khi đúng cấu hình đã ACK, menu/giá/BOM/payment/thuế/dịch vụ cần thiết hợp lệ, đủ nguyên liệu, cảm biến/test drink đạt, không bảo trì/lỗi chặn. Cấu hình cũ/rollback lỗi không được coi sẵn sàng | E2E-01, SC-01.02/03; ma trận blocker cần chốt |
| BR04 | Một đơn nhiều ly, thanh toán một lần; mỗi Cup có hàng đợi, trạng thái và kết quả riêng. Phát lại event/lệnh không pha thêm; lỗi ly hai không hủy hai ly tốt | SC-02.02/03, PBIs!r19–22 |
| BR05 | Giá/ưu đãi/BOM chụp theo phiên bản; tiền giảm phân bổ tới từng ly để tính hoàn đúng. Đề xuất phân bổ tỷ lệ giá trước giảm, làm tròn và dồn phần dư có thứ tự ổn định; thuế/ưu đãi chồng và cơ sở tiền hoàn cần chốt | PBIs!r16/22/33 |
| BR06 | Chỉ phát lệnh pha khi thanh toán được xác nhận hợp lệ; unknown không được coi thất bại. QR hết hạn cho tạo lại sau kiểm tra giao dịch, không tạo thu trùng. Callback thành công muộn/trùng vẫn giữ tiền thực tế và đưa ngoại lệ nếu không còn được pha | Scenarios!r4, SC-02.04 |
| BR07 | Ly lỗi chỉ nhận một quyền lợi: pha lại/mã pha bù hoặc hoàn tiền phần ly lỗi; theo dõi từng lần thực hiện. Hoàn lũy kế không vượt capture chưa hoàn, không hoàn ly tốt. Cơ chế tự động/duyệt và thời hạn cần chốt; không áp chính sách chỉ hoàn toàn đơn cũ | SC-02.03, PBIs!r22 |
| BR08 | Edge lưu đơn/sự kiện chờ đồng bộ, replay idempotent khi có mạng; không mất đơn đã trả tiền. Offline không mặc nhiên cho nhận đơn/thanh toán mới hoặc tự suy ra đã giao ly | SC-02.04, PBIs!r24; chính sách offline mới cần chốt |
| BR09 | Tiến độ 1/N, TTS/ZNS, trạng thái giao/nhận ly, hóa đơn là các chiều riêng. ZNS/HĐĐT lỗi không pha/thu lại; QR nhập hóa đơn không cản nhận nước. Retry không phát hành trùng | SC-02.01/02, PBIs!r17–18 |
| BR10 | Ly pha thành công trừ tồn lý thuyết theo BOM đúng một lần; cảm biến là nguồn quan sát riêng. Ly pha hỏng/test drink/sục rửa có thể tiêu hao nhưng quy tắc chưa chốt: ghi riêng chờ xác nhận, không mặc định bằng 0 hoặc tự coi bán thành công | SC-03.01, PBIs!r13/25/31 |
| BR11 | Cảm biến hết hàng phải khóa món liên quan dù tồn lý thuyết còn; hết hạn không đủ điều kiện bán. Tiếp hàng chỉ cộng số thực nạp có chứng từ, không cộng cả số xuất và số nạp vào cùng kho. Thiếu hàng giữ phần chưa giao | E2E-03, SC-03.02 |
| BR12 | Kiểm kê giữ tồn hệ thống và số đếm, chênh lệch có biên bản/phê duyệt trước điều chỉnh; vệ sinh bảo trì khóa bán và cần checklist/bằng chứng trước mở lại. Acknowledge không đồng nghĩa đã sửa | SC-03.03/04 |
| BR13 | Doanh thu bán thuần sau chiết khấu/hoàn; COGS từ tiêu hao và giá nguyên liệu; chi phí trực tiếp/phân bổ tách biệt, truy nguồn. Thiếu giá/chi phí phải báo chưa đầy đủ, không coi 0 hoặc tuyên bố lãi đúng | SC-04.01/02, E2E-04 |
| BR14 | Đối soát ba bên đơn/tiền–sao kê PSP/ngân hàng–HĐĐT; capture/refund/invoice trạng thái riêng. Match theo định danh/loại/pháp nhân/currency/tiền, không chỉ tổng. Treo hoàn/thiếu ngân hàng/lỗi hóa đơn là ngoại lệ, không tự đánh dấu tiền đã về | SC-04.03, PBIs!r37–38 |
| BR15 | Đề xuất kỳ có version, closed bất biến; ngoại lệ phải được xử lý có bằng chứng và quyền trước chốt. Điều chỉnh sau chốt tham chiếu bản gốc, không sửa lịch sử để cân số. Quyền tất toán và điều kiện chốt chưa được nguồn chốt | SC-04.03; cơ chế đề xuất |
| BR16 | PO có duyệt, nhận nhiều đợt theo số đạt chất lượng, lô/HSD/FEFO; thiếu/trả hàng có chứng từ. Đối chiếu PO–nhập–hóa đơn trước AP; thanh toán một phần giữ số dư và tuổi nợ, không coi PO là đã nhận đủ | SC-05.01–04 |
| BR17 | Ca/máy/nhân viên và bằng chứng check-in/out phải khớp; sai vị trí/vắng/đổi ca vào ngoại lệ. Sync công/lương trùng không nhân giờ/chi phí. Duyệt công và phân bổ có truy vết | SC-06.01–03 |
| BR18 | Lỗi được phân mức/ticket/người nhận/SLA; mất telemetry là thiếu quan sát, không phải robot khỏe. Can thiệp từ xa kiểm ủy quyền và an toàn tại lúc thực thi; restart/OTA khi đang pha phải bị chặn hoặc hoãn theo chính sách | E2E-07, SC-07.01–04 |
| BR19 | OTA theo phiên bản/đợt, ACK và kiểm sức khỏe; lỗi thì rollback về bản ổn định, rollback lỗi giữ khóa bán và tạo escalation. Timeout lệnh là unknown cần xác minh, không báo thành công chỉ vì đã gửi | SC-07.04; chi tiết safety đề xuất |
| BR20 | Tất cả simulator/event/chứng từ có khóa chống trùng, thời gian nghiệp vụ và thời gian nhận; sự kiện cũ không ghi đè trạng thái mới. Audit actor/scope/trước-sau/lý do cho thao tác quan trọng | SC-02.04/06.03/07.03; chuẩn kỹ thuật đề xuất |

### Số liệu và công thức đề xuất cần xác nhận kế toán

- Doanh thu bán thuần = giá trị bán được ghi nhận − giảm giá − hoàn tiền liên quan; mỗi phần chỉ trừ một lần. Thời điểm ghi nhận (pha/giao/nhận ly), thuế gồm/chưa gồm và hoàn kỳ trước chưa được nguồn quy định.
- Tiền thu ròng = capture thành công − refund thành công; không đồng nhất doanh thu hay tiền đã về tài khoản. Refund pending/failed không làm giảm tiền thu thực tế.
- COGS = tổng lượng tiêu hao được tính giá × đơn giá vốn hợp lệ. Phương pháp FIFO/bình quân, hao hụt và điều chỉnh kỳ trước cần chốt.
- Lợi nhuận gộp = doanh thu thuần − COGS; lợi nhuận vận hành = lợi nhuận gộp − chi phí trực tiếp − chi phí chung đã phân bổ. Không cộng trùng chi phí nhân công từ payroll và bút toán tay.
- Phân bổ phải bảo toàn tổng chi phí, có kỳ/tiêu thức/version; tổng mẫu số bằng 0 thì báo ngoại lệ, không chia 0 hoặc phân bổ tùy ý.
- BEP đề xuất = định phí / tỷ lệ số dư đảm phí; tỷ lệ ≤0 hoặc thiếu biến phí/định phí thì “không tính được”, không hiển thị hòa vốn giả.
- Tuổi nợ theo ngày đến hạn và số dư chưa thanh toán; thanh toán một phần giảm đúng khoản phân bổ, không giảm đồng thời mọi hóa đơn NCC.
- Demo đề xuất VND số nguyên, UTC lưu trữ và Asia/Ho_Chi_Minh báo cáo, kỳ [đầu, cuối). Đây là giả định, không quyết định từ nguồn. Không nhân doanh thu ngày để giả thành lịch sử thật.

## 6. Trạng thái đề xuất

Nguồn mô tả hành vi nhưng chưa cung cấp enum chính thức. Các trạng thái dưới đây là ứng viên cần duyệt; giữ lịch sử, actor và lý do chuyển.

| Đối tượng | Chuyển trạng thái và điều kiện |
| --- | --- |
| Robot lifecycle | registered → assigned → commissioned → retired; commissioned cần cấu hình/test đạt. Connectivity unknown/online/offline độc lập với mode paused/selling/maintenance và health unknown/healthy/warning/blocking_fault; busy/preparing là hoạt động hiện thời, không thay thế health |
| Config | draft → validated → dispatched → acknowledged → active; rejected/failed/stale → sửa và phát version mới; rollback_requested → rolled_back hoặc rollback_failed. Chưa ACK đúng version không mở bán |
| Order | draft → awaiting_payment → paid → fulfilling → completed khi mọi ly đã hoàn tất chính sách giao/nhận; mixed result → partially_fulfilled hoặc exception → resolved khi từng ly có kết quả/quyền lợi. Chưa thu tiền có thể cancelled/expired; thành công muộn tạo ngoại lệ, không bỏ capture |
| Cup/BrewAttempt | queued → preparing → dispensed → collected; preparing → failed hoặc unknown. Ly failed → remedy_pending → rebrew_queued/voucher_issued/refund_pending → resolved khi quyền lợi xác nhận. Mỗi lần pha là attempt mới, không xóa lần hỏng; chi tiết picked-up/timeout cần chốt cảm biến |
| PaymentAttempt | created → pending → succeeded/failed/expired/unknown; unknown xác minh về kết quả thật trước retry. Capture đến muộn sau expired/failed lưu sự kiện thành công và ngoại lệ; refund không đổi capture succeeded thành failed |
| Refund / voucher | requested → processing → succeeded/failed/unknown; retry cùng nghiệp vụ không chi hai lần. Voucher issued → redeemed/expired/cancelled; việc chuyển giữa voucher và refund cần khóa quyền lợi để không hưởng kép |
| Invoice / notification | requested → processing → issued/sent hoặc failed/unknown; retry theo khóa gốc. Điều chỉnh hóa đơn lưu liên kết bản gốc; chính sách hóa đơn khi hoàn một phần cần chốt |
| Reconciliation | draft → matching → review_required/ready_to_close → closed; lỗi đọc dữ liệu về draft có lỗi. Sự kiện mới trước chốt kéo về review; sau closed tạo adjustment/version mới. Closed không đồng nghĩa đã payout |
| Refill / kiểm kê | request → approved → issued → in_transit → partially_received/received → reconciled; shortage/discrepancy giữ ngoại lệ. Count draft → submitted → approved/rejected → adjusted; không điều chỉnh trước duyệt |
| PO / AP | PO draft → submitted → approved → partially_received/received → closed; nhận lỗi/trả giữ chứng từ. AP open → partially_paid → paid; disputed/overdue là chiều riêng, không mất số dư |
| Công / ticket | Attendance captured → exception/submitted → approved/rejected → exported → acknowledged; ticket open → assigned → acknowledged → in_progress → resolved → closed, có reopen nếu kiểm tra không đạt; quá SLA là cờ độc lập |
| Remote/OTA | Command requested → authorized → queued → executing → succeeded/failed/unknown; hết quyền hoặc busy chặn/hoãn. OTA planned → eligible → deploying → verifying → succeeded hoặc rollback_pending → rolled_back/rollback_failed; chỉ kết quả kiểm chứng mới phục hồi bán |

## 7. Trang, điều hướng và quyền đề xuất

| Vai trò | Trang ưu tiên | Hành động trong scope |
| --- | --- | --- |
| Provider Operations | Web Monitor: bản đồ/robot → hồ sơ/cấu hình/log/camera; cảnh báo/ticket; hỗ trợ từ xa; phiên bản/OTA | Khai báo hãng/model/serial, gán tenant, theo dõi, nhận/phân công ticket, can thiệp theo ủy quyền. Không tự có quyền kế toán/hoàn tiền của tenant |
| Chain Manager | CukCuk Web: tổng quan → pháp nhân/điểm bán/robot → menu/BOM/giá/cấu hình Kiosk → vận hành/tồn → đơn/ly → nhân sự → hiệu quả | Cấu hình/mở-khóa bán, phân công và duyệt trong scope theo capability được cấp; quyền duyệt kiểm kê/mua/tài chính cần chốt |
| Business Owner | Tổng quan kinh doanh → doanh thu/COGS/chi phí/P&L/BEP → thanh toán/hoàn/hóa đơn → đối soát → báo cáo nguồn | Xem/drill-down/export trong phạm vi được cấp; không mặc định được chạy lệnh thiết bị hoặc tất toán |
| Actor nguồn bổ sung | Ops App: tuyến/ca, refill/count/clean, chấm công, ticket; kế toán/kho/mua: chứng từ, PO/AP, công/lương; Kiosk: menu/giỏ/QR/thanh toán/tiến độ/nhận ly/hóa đơn | Có mặt trong kiến trúc tổng thể; demo ba vai trò dùng simulator thể hiện bàn giao, không giả định đã có đầy đủ quyền/ứng dụng riêng |

Điều hướng giữ Organization/pháp nhân/Chain/Site/robot/kỳ, breadcrumb và đường về chứng từ gốc. Trạng thái loading, empty, stale/offline, denied, lỗi tích hợp và dữ liệu thiếu riêng biệt. CSV khớp scope/filter, nhãn mock/timezone/currency/cập nhật. Không dùng việc ẩn menu thay kiểm tra quyền.

## 8. Phạm vi và lộ trình

**Phạm vi cập nhật đã được người dùng cho phép:** triển khai trang khách mua cà phê mô phỏng, chọn robot/món/số lượng, kiểm tồn/tạo đơn, payment và kết quả từng ly, ghi sự cố/cần hoàn, cập nhật dashboard/đơn/tồn/báo cáo và test. Chỉ dùng dữ liệu giả lập. Nền tảng nghiệp vụ phải phản ánh đủ bảy E2E; mua/AP, nhân sự/lương, P&L, hóa đơn, kiosk và OTA không bị xóa như bản cũ.

**Theo kế hoạch nguồn, không phải cam kết phát hành của repository:** Scenario RC1 gồm SC-01.01–03, SC-02.01–02, SC-03.01; RC2 gồm SC-02.03–04, SC-03.02–04, SC-06.02–03, SC-07.01–02; RC3 gồm SC-04.01–04, SC-05.01–04, SC-06.01, SC-07.03–04. PBIs!r5–20 có RC1; phần còn lại để trống phiên bản, không suy diễn điền theo Scenario. P0 không đồng nghĩa RC1: có P0 ở RC2/RC3.

**Đề xuất MVP demo để duyệt sau:** ba vai trò xem/vận hành trong scope, mock dữ liệu nền E2E-01; đơn từng ly và tiền E2E-02 gồm lỗi/hoàn phần; BOM/cảm biến/tồn E2E-03; truy nguồn tiền–hóa đơn/chi phí E2E-04; ticket E2E-07. Luồng E2E-05/06 và OTA vẫn có hợp đồng dữ liệu/fixture và tiêu chí, có thể minh họa read-only trước. Đây là phương án phân lát, không quyết định bỏ hoặc hạ ưu tiên các PBI nguồn; chưa xác nhận MVP hay lịch mới.

**Chưa thực hiện ngoài lát cắt demo khách mua cà phê:** API/backend và phần còn lại của nền tảng, thiết bị/PSP/ngân hàng/meInvoice/Zalo/AMIS/camera/GPS/OTA thật, gửi thông báo hoặc thực thi lệnh thật. Chính sách production về bảo mật, SLA, retention, kế toán/thuế và vận hành cần được xác nhận. Không thêm tính năng không có trong nguồn như đa tiền tệ hoặc payout chủ động nếu chưa có yêu cầu.

## 9. Giả định, mâu thuẫn và quyết định cần chốt

Thay A1–A9 cũ bằng danh mục dưới; không dùng giả định cũ làm luật hiện hành.

| ID | Chưa rõ / phương án đề xuất |
| --- | --- |
| D01 | Tenant–pháp nhân–chuỗi–điểm–máy: đề xuất Site nhiều robot, Tenant có nhiều pháp nhân; xác nhận “máy (chi nhánh)” PBIs!r39 và quyền xuyên pháp nhân |
| D02 | Quyền hoàn tự động/mã pha bù/duyệt/tất toán, giới hạn/expiry và bên chịu tiền: đề xuất capability theo pháp nhân, khóa quyền lợi từng ly; không giao mặc định cho Provider |
| D03 | Công thức thuế/ưu đãi/tiền hoàn, giá vốn, phân bổ, thời điểm doanh thu và hóa đơn sau hoàn phần: cần chủ nghiệp vụ/kế toán chốt; demo dùng bộ quy tắc ghi nhãn giả lập |
| D04 | Trạng thái nhận ly, tiêu hao pha hỏng/test/clean, TTL heartbeat/ngưỡng tồn/SLA và an toàn restart: nguồn chưa có thông số; simulator dùng tham số hiển thị rõ, không ghi thành SLA xác nhận |
| D05 | Chuỗi ca RC3 → công/lương RC2 trái thứ tự phụ thuộc; phiên bản PBI trống, PBI ID trống; r57/r58 gần trùng. Giữ nguồn và yêu cầu làm rõ trước lập sprint |
| D06 | Mở bán phụ thuộc dịch vụ nào khi HĐĐT/ZNS gián đoạn; mất mạng có nhận đơn mới không; cách lấy menu/BOM gốc từ robot rồi quản lý version phía Web: cần chốt source of truth và degraded mode |
| D07 | Tích hợp thật/retention camera-GPS/ủy quyền/rollback và ranh giới trách nhiệm S1–S6 chưa có hợp đồng chi tiết; thiết kế adapter/event giả lập trước, không tuyên bố tích hợp hoàn tất |

Ba nhóm câu hỏi ưu tiên: (1) chốt mô hình pháp nhân và quyền tài chính/hỗ trợ; (2) chốt chính sách từng ly–tiền–hóa đơn–giá vốn; (3) chốt phạm vi MVP, phiên bản/phụ thuộc và hợp đồng S1–S6. Có thể hoàn thiện thiết kế bằng giả định có nhãn trong khi chờ, không cần tự xác nhận các quyết định này.

## 10. Kiến trúc ứng viên và nghiệm thu

Tách module Identity/Scope, Device & Config, Sales/Cup Workflow, Payment/Refund/Invoice, Stock & Ops, Procurement/AP, Workforce, Finance/Reconciliation và Support/OTA. Giao tiếp qua event có event_id, source, tenant/legal_entity, robot/order/cup, version, observed_at/received_at, correlation và kết quả; consumer chống trùng. Adapter mock thay dịch vụ thật, không mô phỏng thành công mặc định. Các nguồn đơn/ledger/chứng từ là cơ sở báo cáo, không cộng từ KPI hiển thị.

Repository hiện là demo React/localStorage; chưa chứng minh đáp ứng đặc tả này. Xem [ACCEPTANCE_CRITERIA.md](ACCEPTANCE_CRITERIA.md) cho tiêu chí tương lai. Nghiệm thu mock, integration thật và phần cứng thật là ba mức khác nhau; không lấy test demo cũ thay nghiệm thu E2E nguồn.

## 11. Lát cắt đã triển khai và giới hạn nghiệm thu

Theo yêu cầu triển khai tiếp theo, bổ sung `sales.ts` và trang Khách mua cà phê/Đơn hàng/Báo cáo. Truy vết: E2E-02 → SC-02.01/02/03/04 → PBIs!r15/19/20/21/22/24 (chỉ một phần), BR03/04/06/07/08/10/20; E2E-03/04 nhận kết quả tiêu hao và số liệu. Không coi lưu localStorage là Edge–Cloud sync thật.

Mỗi đơn hiện chỉ một loại đồ uống × số lượng, từng ly có ID/kết quả độc lập, reserve lúc tạo và consume khi thành công. Doanh thu ghi theo ly thành công, đơn hoàn tất khi tất cả ly tốt. Ly lỗi giữ tiền capture và khoản cần hoàn, không hoàn tự động; không tiêu hao ly lỗi theo giả định demo hiện tại. Kết quả các ly đã bắt đầu có thể xác nhận riêng sau một ly lỗi, còn robot bị khóa nhận đơn mới. Các giả định/giới hạn và hướng dẫn demo chi tiết ở [README](../README.md). Lưu snapshot chỉ hỗ trợ một trình duyệt/tab, chưa có quyền production.
