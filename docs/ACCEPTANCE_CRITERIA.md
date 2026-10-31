# Acceptance Criteria — theo nguồn E2E / Scenario / PBI

Trạng thái: **đặc tả nghiệm thu toàn nền tảng; chỉ một phần lát cắt mua cà phê đã có kiểm thử**, xem bằng chứng cuối tài liệu. Mọi dịch vụ, thiết bị, khách hàng, chứng từ, ảnh/GPS và giao dịch đều giả lập. Các phương án D01–D07 trong PRODUCT_SPEC.md cần duyệt; tiêu chí an toàn được đề xuất không phải tuyên bố enum/quyền/công thức đã được workbook xác nhận.

## Chuẩn bị và cách đọc

Fixture xác định: ít nhất hai tenant/pháp nhân; hai Chain; một Site nhiều robot; ba vai trò MVP và capability actor nguồn mô phỏng; một robot có lịch sử chuyển điểm. Ba ly có ID độc lập, BOM/giá/ưu đãi snapshot, clock điều khiển được, event_id cố định; có capture/refund/invoice/sao kê và lỗi tích hợp riêng. Kỳ/timezone/currency và chính sách công thức demo được công khai. Reset độc lập từng ca; không dùng dữ liệu hay dịch vụ thật.

Mỗi dòng sau là Given (fixture/điều kiện nêu), When (thực hiện luồng), Then (kết quả và ngoại lệ phải kiểm). Nghiệm thu cả dữ liệu/chứng từ/audit và UI khi triển khai; không chỉ kiểm nút/menu hoặc ảnh màn hình. Mã AC mới `AC-SC-xx.xx` thay bộ AC01–24 cũ để bám Scenario nguồn.

## Tiêu chí theo đủ 26 Scenario

### AC-SC-01.01: Khởi tạo pháp nhân, điểm bán và kết nối robot

Nguồn: Scenarios!r12; E2E-01; PBIs!r5, PBIs!r6, PBIs!r7. Quy tắc: BR01–02. Kế hoạch Scenario: P0, RC1 (không phải trạng thái nghiệm thu).

Có hai tenant/pháp nhân và hãng/model/serial giả; khai báo, gán rồi kết nối robot đúng tenant thì hồ sơ và scope khớp. Serial trùng/gán sai tenant bị từ chối; mở ID khác scope không lộ dữ liệu.

### AC-SC-01.02: Thiết lập kinh doanh và các dịch vụ tích hợp

Nguồn: Scenarios!r13; E2E-01; PBIs!r8, PBIs!r9, PBIs!r10, PBIs!r11, PBIs!r12. Quy tắc: BR03/05. Kế hoạch Scenario: P0, RC1 (không phải trạng thái nghiệm thu).

Đồng bộ menu/BOM gốc từ robot, cấu hình giá/thuế/tài khoản nhận tiền/meInvoice/branding/video/TTS và nhân viên theo điểm; Kiosk nhận đúng version và quyền. Sai pháp nhân, BOM thiếu, tài khoản sai hoặc ACK version cũ không được báo cấu hình hoàn tất.

### AC-SC-01.03: Kiểm tra điều kiện sẵn sàng và mở bán

Nguồn: Scenarios!r14; E2E-01; PBIs!r13, PBIs!r14. Quy tắc: BR03. Kế hoạch Scenario: P0, RC1 (không phải trạng thái nghiệm thu).

Nạp ban đầu, kiểm cảm biến/test drink và checklist readiness đạt mới mở bán. Thiếu nguyên liệu, mất mạng, cấu hình stale/test lỗi hoặc rollback thất bại chặn mở; lưu kết quả test và actor, không tạo doanh thu bán từ test drink.

### AC-SC-02.01: Khách mua một ly đồ uống thành công

Nguồn: Scenarios!r15; E2E-02; PBIs!r15, PBIs!r16, PBIs!r17, PBIs!r18. Quy tắc: BR05/06/09. Kế hoạch Scenario: P0, RC1 (không phải trạng thái nghiệm thu).

Khách chỉ chọn món còn nguyên liệu, áp mã ưu đãi giả hợp lệ/không hợp lệ, thanh toán và nhận một ly đúng; TTS/ZNS đúng đơn và QR hóa đơn cho nhập dữ liệu khách giả/nhận email giả. ZNS hoặc HĐĐT lỗi có retry riêng, không cản nhận ly hoặc thu/pha lại.

### AC-SC-02.02: Khách mua nhiều ly trong một đơn

Nguồn: Scenarios!r16; E2E-02; PBIs!r19, PBIs!r20. Quy tắc: BR04. Kế hoạch Scenario: P0, RC1 (không phải trạng thái nghiệm thu).

Đơn ba ly khác nhau thanh toán một lần, mỗi ly có ID, hàng đợi, tiến độ 1/3→3/3 và thông báo lấy đúng ly; sự kiện trùng không pha thêm, chưa lấy ly giữ trạng thái riêng. Giá/tiền tổng khớp các ly.

### AC-SC-02.03: Xử lý pha lỗi và hoàn tiền

Nguồn: Scenarios!r17; E2E-02; PBIs!r21, PBIs!r22. Quy tắc: BR04/07. Kế hoạch Scenario: P0, RC2 (không phải trạng thái nghiệm thu).

Ly thứ hai trong đơn ba ly lỗi: khóa món lỗi/cảnh báo, giữ hai ly tốt; thử riêng nhánh pha lại, mã pha bù và hoàn phần ly lỗi. Không vừa đổi voucher vừa hoàn, không hoàn ly tốt, callback trùng không chi/pha trùng; refund failed/unknown giữ ngoại lệ. Có ưu đãi thì tổng hoàn không vượt phần tiền ly được phân bổ theo chính sách demo công khai.

### AC-SC-02.04: Xử lý thanh toán lỗi, mất kết nối và phục hồi

Nguồn: Scenarios!r18; E2E-02; PBIs!r23, PBIs!r24. Quy tắc: BR06/08/20. Kế hoạch Scenario: P0, RC2 (không phải trạng thái nghiệm thu).

QR hết hạn hoặc phản hồi chậm phải kiểm tra thanh toán trước retry; callback trùng/muộn không mất capture hoặc pha/hoàn hai lần. Mất mạng sau trả tiền giữ đơn trên Edge, khôi phục/sync nhiều lần cho một bản ghi cloud; không tự cho thanh toán offline mới khi chưa có chính sách.

### AC-SC-03.01: Theo dõi tiêu hao và tồn nguyên liệu tại robot

Nguồn: Scenarios!r19; E2E-03; PBIs!r25, PBIs!r26. Quy tắc: BR10/11. Kế hoạch Scenario: P0, RC1 (không phải trạng thái nghiệm thu).

Mỗi ly thành công trừ BOM version đúng một lần; tồn thấp phát cảnh báo. Tồn lý thuyết còn nhưng cảm biến hết thì khóa món; dữ liệu cảm biến và tồn không bị ghi đè thành một số. Pha lỗi/test/clean được ghi loại tiêu hao riêng theo policy demo, không tự tính là đơn bán.

### AC-SC-03.02: Lập kế hoạch cấp phát và tiếp hàng tại robot

Nguồn: Scenarios!r20; E2E-03; PBIs!r27, PBIs!r28. Quy tắc: BR11. Kế hoạch Scenario: P2, RC2 (không phải trạng thái nghiệm thu).

Thiếu hàng tạo đề xuất, duyệt và xuất kho tổng rồi Ops xác nhận thực nạp từng bình. Xuất 10 nhưng nạp 8 thì kho máy chỉ tăng 8, phần 2 còn chờ đối chiếu; thiếu kho/nhân viên không đến không tự nhận đủ. Replay nhận hàng không cộng trùng; chỉ mở lại món khi đủ điều kiện.

### AC-SC-03.03: Kiểm kê và xử lý chênh lệch nguyên liệu

Nguồn: Scenarios!r21; E2E-03; PBIs!r29, PBIs!r30. Quy tắc: BR12. Kế hoạch Scenario: P1, RC2 (không phải trạng thái nghiệm thu).

Cuối ca lưu tồn hệ thống và số đếm khác nhau; kế toán kho duyệt biên bản mới sinh phiếu điều chỉnh. Chưa duyệt/từ chối không đổi tồn; chênh lớn cần được nhận diện, audit giữ số trước/sau/chứng từ.

### AC-SC-03.04: Vệ sinh, bảo trì và duy trì điều kiện hoạt động

Nguồn: Scenarios!r22; E2E-03; PBIs!r31, PBIs!r32. Quy tắc: BR12. Kế hoạch Scenario: P0, RC2 (không phải trạng thái nghiệm thu).

Chạy checklist vệ sinh/sục rửa/ảnh giả trong mode ngưng bán; không nhận đơn mới khi bảo trì. Thiếu bước hoặc bằng chứng không coi hoàn tất; sau kiểm tra đạt mới cho thao tác mở bán lại, không tự xóa blocking fault.

### AC-SC-04.01: Tổng hợp doanh thu, giá vốn và tính lãi/lỗ

Nguồn: Scenarios!r23; E2E-04; PBIs!r33, PBIs!r34. Quy tắc: BR13. Kế hoạch Scenario: P0, RC3 (không phải trạng thái nghiệm thu).

Theo máy/ngày/pháp nhân: fixture giá bán 100.000, giảm 10.000, hoàn 20.000 cho doanh thu thuần 70.000 dưới chính sách demo đã công bố; COGS 30.000 thì lãi gộp 40.000. Drill-down về ly/BOM/giá nguồn, refund trùng không trừ hai lần; thiếu giá nhập phải đánh dấu chưa đủ dữ liệu.

### AC-SC-04.02: Ghi nhận và phân bổ chi phí kinh doanh

Nguồn: Scenarios!r24; E2E-04; PBIs!r35, PBIs!r36. Quy tắc: BR13. Kế hoạch Scenario: P1, RC3 (không phải trạng thái nghiệm thu).

Ghi chi phí trực tiếp và phân bổ chi phí chung 100.000 theo tỷ trọng 1:3 thành 25.000/75.000, bảo toàn tổng. Mẫu số 0, thiếu chứng từ hoặc nhân công đã nhập từ payroll phải thành ngoại lệ, không tính trùng; truy được rule/version và kỳ.

### AC-SC-04.03: Đối soát thanh toán, hoàn tiền và hóa đơn

Nguồn: Scenarios!r25; E2E-04; PBIs!r37, PBIs!r38. Quy tắc: BR14/15. Kế hoạch Scenario: P0, RC3 (không phải trạng thái nghiệm thu).

Đối chiếu đơn/capture/refund với sao kê PSP/ngân hàng và HĐĐT cùng pháp nhân. Thử thiếu tiền ngân hàng dù callback succeeded, hoàn pending, invoice failed, sai tiền và dòng trùng: phân loại riêng và truy nguồn. Xử lý tất toán có quyền/lý do/bằng chứng; chưa xử lý không chốt. Batch closed không bị sửa, giao dịch muộn sinh điều chỉnh; closed không tự coi đã payout.

### AC-SC-04.04: Phân tích hiệu quả kinh doanh từng robot và toàn chuỗi

Nguồn: Scenarios!r26; E2E-04; PBIs!r39, PBIs!r40. Quy tắc: BR13/14. Kế hoạch Scenario: P1, RC3 (không phải trạng thái nghiệm thu).

Báo cáo máy/nhóm/chuỗi/pháp nhân có doanh thu/số ly/lợi nhuận/biên/BEP/xếp hạng, Web và App mock khớp cùng bộ lọc và thời điểm. Thiếu giá/chi phí đánh dấu chưa đầy đủ; tỷ lệ đảm phí ≤0 không tính BEP giả; drill-down/CSV khớp nguồn và không cộng nhầm pháp nhân.

### AC-SC-05.01: Lập kế hoạch mua hàng và đặt mua nhà cung cấp

Nguồn: Scenarios!r27; E2E-05; PBIs!r41, PBIs!r42, PBIs!r43. Quy tắc: BR16. Kế hoạch Scenario: P2, RC3 (không phải trạng thái nghiệm thu).

Từ tiêu hao/tồn tối thiểu sinh gợi ý, dữ liệu cùng kỳ sinh dự báo có giả định và nguồn riêng; thiếu lịch sử không đưa dự báo chắc chắn. Tạo/duyệt PO đúng lượng/giá/ngân sách theo quyền; PO chưa duyệt không được coi đã gửi/đã nhận.

### AC-SC-05.02: Tiếp nhận hàng mua và nhập kho

Nguồn: Scenarios!r28; E2E-05; PBIs!r44, PBIs!r45. Quy tắc: BR16. Kế hoạch Scenario: P2, RC3 (không phải trạng thái nghiệm thu).

PO 10 đơn vị nhận hai lần 4 và 6; một phần lô lỗi/quá hạn thì chỉ lượng đạt được nhập, thiếu/trả có biên bản. Tồn/lô/HSD/FEFO đúng từng lần; nhập replay không nhân tồn, tổng nhận không vượt cho phép nếu chưa duyệt ngoại lệ.

### AC-SC-05.03: Đối chiếu hóa đơn, công nợ và thanh toán NCC

Nguồn: Scenarios!r29; E2E-05; PBIs!r46, PBIs!r47. Quy tắc: BR16. Kế hoạch Scenario: P2, RC3 (không phải trạng thái nghiệm thu).

Đối chiếu PO–nhập–hóa đơn, hóa đơn không khớp bị treo thay vì tự chi. AP 100.000 trả 40.000 còn 60.000; tuổi nợ theo due_date, lần trả sau giảm đúng hóa đơn; không nhân bút toán khi sync kế toán trùng.

### AC-SC-05.04: Báo cáo mua hàng và quản lý nhà cung cấp

Nguồn: Scenarios!r30; E2E-05; PBIs!r48. Quy tắc: BR16. Kế hoạch Scenario: P2, RC3 (không phải trạng thái nghiệm thu).

Theo NCC/NVL/kỳ xem biến động giá, chất lượng giao, công nợ/tuổi nợ và cảnh báo; số liệu truy tới PO/nhận/return/AP, một PO giao hai lần không bị đếm hai PO; phiếu chưa nhận không cộng tồn.

### AC-SC-06.01: Thiết lập nhân viên, ca làm và tuyến vận hành

Nguồn: Scenarios!r31; E2E-06; PBIs!r49. Quy tắc: BR01/17. Kế hoạch Scenario: P1, RC3 (không phải trạng thái nghiệm thu).

Nhân viên được gán ca/tuyến/máy và quyền đúng scope, Ops nhận lịch version mới. Đổi ca giữ lịch sử; nhân viên ngoài phạm vi không thao tác máy khác; dữ liệu lịch trùng không tạo hai công việc.

### AC-SC-06.02: Thực hiện công việc và ghi nhận chấm công

Nguồn: Scenarios!r32; E2E-06; PBIs!r50, PBIs!r51. Quy tắc: BR17. Kế hoạch Scenario: P1, RC2 (không phải trạng thái nghiệm thu).

GPS/QR/ảnh giả check-in/out đúng máy/ca/nhân viên thì tạo attendance/bằng chứng; sai vị trí, vắng hoặc không xử lý máy lỗi tạo ngoại lệ/cảnh báo điều phối. Sync cùng event nhiều lần không nhân công; không truy cập GPS/camera thật.

### AC-SC-06.03: Duyệt công, tính lương và phân bổ chi phí nhân sự

Nguồn: Scenarios!r33; E2E-06; PBIs!r52, PBIs!r53. Quy tắc: BR17. Kế hoạch Scenario: P2, RC2 (không phải trạng thái nghiệm thu).

Rà soát/duyệt bảng công rồi export payroll/AMIS mock và phân bổ nhân công theo máy; công chưa duyệt không tính như đã duyệt. Retry sync không nhân lương/chi phí, kết quả từ chối có thể truy và xử lý, không ghi ACK giả.

### AC-SC-07.01: Giám sát toàn chuỗi và phát hiện cảnh báo

Nguồn: Scenarios!r34; E2E-07; PBIs!r54, PBIs!r55, PBIs!r56. Quy tắc: BR18/20. Kế hoạch Scenario: P0, RC2 (không phải trạng thái nghiệm thu).

Bản đồ có online/offline/đang pha/lỗi và thời gian dữ liệu; mô phỏng offline, lỗi phân mức, va đập/xâm nhập/camera mất kết nối sinh cảnh báo/ticket đúng scope. Mất telemetry không được hiển thị healthy mới; cùng lỗi trùng không tạo ticket vô hạn.

### AC-SC-07.02: Tiếp nhận và xử lý sự cố tại robot

Nguồn: Scenarios!r35; E2E-07; PBIs!r57, PBIs!r58, PBIs!r59. Quy tắc: BR18. Kế hoạch Scenario: P0, RC2 (không phải trạng thái nghiệm thu).

Ticket được phân công, Ops nhận thông báo/hướng dẫn và cập nhật nguyên nhân/linh kiện/ảnh giả. Không người nhận/quá SLA có escalation; đóng thiếu bằng chứng bị từ chối; kiểm tra chưa đạt cho reopen. Cảnh báo và thông báo ticket r57/r58 được truy vết riêng, không mặc định hai ticket.

### AC-SC-07.03: Hỗ trợ kỹ thuật từ xa và khôi phục hoạt động

Nguồn: Scenarios!r36; E2E-07; PBIs!r60. Quy tắc: BR01/18. Kế hoạch Scenario: P0, RC3 (không phải trạng thái nghiệm thu).

Support có ủy quyền đúng pháp nhân được xem log và mô phỏng Start/Stop/Pause/Restore; ủy quyền hết hạn trước thực thi hoặc đang pha chặn/hoãn lệnh nguy hiểm. Có audit quyền/lệnh/kết quả; timeout là unknown, không thành công giả, không hỗ trợ nhầm tenant.

### AC-SC-07.04: Cập nhật OTA, rollback và kiểm soát vận hành

Nguồn: Scenarios!r37; E2E-07; PBIs!r61, PBIs!r62. Quy tắc: BR19. Kế hoạch Scenario: P0, RC3 (không phải trạng thái nghiệm thu).

Lên lịch OTA thấp điểm theo đợt/version; robot không đủ an toàn không cập nhật. Update lỗi phải rollback bản ổn định và xác minh; rollback lỗi khóa bán/escalate. ACK trùng không chạy cập nhật lại; không coi đã gửi lệnh là đã nâng cấp thành công.

## Tiêu chí xuyên luồng

- AC-X01: Kịch bản E2E-01 bàn giao đúng tenant/config cho E2E-02; kết quả từng ly cập nhật tồn E2E-03 và tiền/hóa đơn/P&L E2E-04, truy xuyên bằng correlation_id mà không nhân sự kiện.
- AC-X02: E2E-05 nhận hàng làm cơ sở kho/giá; E2E-06 công đã duyệt làm cơ sở nhân công; báo cáo thiếu một nguồn phải chỉ rõ phần thiếu. Không tự điền 0 hoặc khẳng định lợi nhuận đầy đủ.
- AC-X03: Mọi role/scope bị kiểm ở danh sách/ID trực tiếp/tổng hợp/export/hành động. Provider thiếu ủy quyền không can thiệp hoặc truy tài chính tenant; giả lập quyền UI-only phải ghi giới hạn, không tuyên bố bảo mật production.
- AC-X04: Ranh giới kỳ [đầu, cuối), hoàn kỳ trước, event muộn, robot chuyển Site và nhiều pháp nhân không đổi nguồn lịch sử hoặc cộng trùng. CSV và drill-down giữ cùng filter/currency/timezone.
- AC-X05: Empty/loading/error/stale/denied/missing-data độc lập; ZNS, invoice, sync, payment và OTA thất bại không hiện thông báo hoàn tất sai. Tất cả trang/file xuất có nhãn dữ liệu giả lập.

## Truy vết toàn bộ PBI

Bảng dưới đảm bảo không bỏ PBI vì thiếu ID/phiên bản. Tiêu đề nguyên văn nằm ở SOURCE_TRACEABILITY.md. Một AC Scenario bao phủ nhiều PBI, khi thi công cần tách test case theo từng nhu cầu và ngoại lệ, không đánh dấu mọi PBI đạt chỉ vì một test chung đạt.

| Định vị nguồn (không phải PBI ID) | E2E | Scenario | Tiêu chí | Phiên bản PBI nguồn |
| --- | --- | --- | --- | --- |
| PBIs!r5 | E2E-01 | SC-01.01 | AC-SC-01.01 | RC1 |
| PBIs!r6 | E2E-01 | SC-01.01 | AC-SC-01.01 | RC1 |
| PBIs!r7 | E2E-01 | SC-01.01 | AC-SC-01.01 | RC1 |
| PBIs!r8 | E2E-01 | SC-01.02 | AC-SC-01.02 | RC1 |
| PBIs!r9 | E2E-01 | SC-01.02 | AC-SC-01.02 | RC1 |
| PBIs!r10 | E2E-01 | SC-01.02 | AC-SC-01.02 | RC1 |
| PBIs!r11 | E2E-01 | SC-01.02 | AC-SC-01.02 | RC1 |
| PBIs!r12 | E2E-01 | SC-01.02 | AC-SC-01.02 | RC1 |
| PBIs!r13 | E2E-01 | SC-01.03 | AC-SC-01.03 | RC1 |
| PBIs!r14 | E2E-01 | SC-01.03 | AC-SC-01.03 | RC1 |
| PBIs!r15 | E2E-02 | SC-02.01 | AC-SC-02.01 | RC1 |
| PBIs!r16 | E2E-02 | SC-02.01 | AC-SC-02.01 | RC1 |
| PBIs!r17 | E2E-02 | SC-02.01 | AC-SC-02.01 | RC1 |
| PBIs!r18 | E2E-02 | SC-02.01 | AC-SC-02.01 | RC1 |
| PBIs!r19 | E2E-02 | SC-02.02 | AC-SC-02.02 | RC1 |
| PBIs!r20 | E2E-02 | SC-02.02 | AC-SC-02.02 | RC1 |
| PBIs!r21 | E2E-02 | SC-02.03 | AC-SC-02.03 | — |
| PBIs!r22 | E2E-02 | SC-02.03 | AC-SC-02.03 | — |
| PBIs!r23 | E2E-02 | SC-02.04 | AC-SC-02.04 | — |
| PBIs!r24 | E2E-02 | SC-02.04 | AC-SC-02.04 | — |
| PBIs!r25 | E2E-03 | SC-03.01 | AC-SC-03.01 | — |
| PBIs!r26 | E2E-03 | SC-03.01 | AC-SC-03.01 | — |
| PBIs!r27 | E2E-03 | SC-03.02 | AC-SC-03.02 | — |
| PBIs!r28 | E2E-03 | SC-03.02 | AC-SC-03.02 | — |
| PBIs!r29 | E2E-03 | SC-03.03 | AC-SC-03.03 | — |
| PBIs!r30 | E2E-03 | SC-03.03 | AC-SC-03.03 | — |
| PBIs!r31 | E2E-03 | SC-03.04 | AC-SC-03.04 | — |
| PBIs!r32 | E2E-03 | SC-03.04 | AC-SC-03.04 | — |
| PBIs!r33 | E2E-04 | SC-04.01 | AC-SC-04.01 | — |
| PBIs!r34 | E2E-04 | SC-04.01 | AC-SC-04.01 | — |
| PBIs!r35 | E2E-04 | SC-04.02 | AC-SC-04.02 | — |
| PBIs!r36 | E2E-04 | SC-04.02 | AC-SC-04.02 | — |
| PBIs!r37 | E2E-04 | SC-04.03 | AC-SC-04.03 | — |
| PBIs!r38 | E2E-04 | SC-04.03 | AC-SC-04.03 | — |
| PBIs!r39 | E2E-04 | SC-04.04 | AC-SC-04.04 | — |
| PBIs!r40 | E2E-04 | SC-04.04 | AC-SC-04.04 | — |
| PBIs!r41 | E2E-05 | SC-05.01 | AC-SC-05.01 | — |
| PBIs!r42 | E2E-05 | SC-05.01 | AC-SC-05.01 | — |
| PBIs!r43 | E2E-05 | SC-05.01 | AC-SC-05.01 | — |
| PBIs!r44 | E2E-05 | SC-05.02 | AC-SC-05.02 | — |
| PBIs!r45 | E2E-05 | SC-05.02 | AC-SC-05.02 | — |
| PBIs!r46 | E2E-05 | SC-05.03 | AC-SC-05.03 | — |
| PBIs!r47 | E2E-05 | SC-05.03 | AC-SC-05.03 | — |
| PBIs!r48 | E2E-05 | SC-05.04 | AC-SC-05.04 | — |
| PBIs!r49 | E2E-06 | SC-06.01 | AC-SC-06.01 | — |
| PBIs!r50 | E2E-06 | SC-06.02 | AC-SC-06.02 | — |
| PBIs!r51 | E2E-06 | SC-06.02 | AC-SC-06.02 | — |
| PBIs!r52 | E2E-06 | SC-06.03 | AC-SC-06.03 | — |
| PBIs!r53 | E2E-06 | SC-06.03 | AC-SC-06.03 | — |
| PBIs!r54 | E2E-07 | SC-07.01 | AC-SC-07.01 | — |
| PBIs!r55 | E2E-07 | SC-07.01 | AC-SC-07.01 | — |
| PBIs!r56 | E2E-07 | SC-07.01 | AC-SC-07.01 | — |
| PBIs!r57 | E2E-07 | SC-07.02 | AC-SC-07.02 | — |
| PBIs!r58 | E2E-07 | SC-07.02 | AC-SC-07.02 | — |
| PBIs!r59 | E2E-07 | SC-07.02 | AC-SC-07.02 | — |
| PBIs!r60 | E2E-07 | SC-07.03 | AC-SC-07.03 | — |
| PBIs!r61 | E2E-07 | SC-07.04 | AC-SC-07.04 | — |
| PBIs!r62 | E2E-07 | SC-07.04 | AC-SC-07.04 | — |

## Gate nghiệm thu và bằng chứng

1. Unit test state transition từng ly/payment/refund, scope, tiền/BOM, kỳ và idempotency; integration test event→chứng từ→ledger→đối soát/P&L; E2E kiểm cả bảy luồng theo nguồn. Chỉ chạy các phần được giao triển khai, báo rõ phần chưa chạy.
2. Test phải xác nhận side effect/chứng từ/audit/số liệu, không chỉ port/PID hoặc snapshot UI; phân biệt passed/failed/skipped/unrun. Hiện toàn bộ AC ở tài liệu này **unrun**.
3. Build/typecheck/test demo hiện có vẫn là kiểm tra regression, không phải bằng chứng tính năng nguồn “Đã đáp ứng”. Nhãn đáp ứng/tiến độ trong workbook chưa được xác thực với code.
4. E2E-01 nguồn yêu cầu robot thật; E2E-02 nguồn có thanh toán/hóa đơn thật. Chỉ nghiệm thu giả lập trong phạm vi hiện tại; hardware/integration production là gate riêng chưa thực hiện.
5. Trước lập sprint, xác nhận PBI ID, phiên bản còn trống, phụ thuộc RC3/RC2 nhân sự, chính sách D01–D07 và phạm vi MVP. Không coi tất cả RC1 là MVP đã ký hoặc loại P0 ở RC2/RC3 khỏi nền tảng.

## Bằng chứng cho lát cắt mua cà phê

Lát cắt hiện tại có test tự động trong `src/sales.test.ts` (23 ca logic), `src/CustomerFlow.test.tsx` (7 ca tích hợp), `tests/customer-browser.cjs` (4 nhánh trình duyệt). Đây là kiểm chứng một phần AC-SC-02.01…04, AC-SC-03.01 và AC-X01/04/05: happy path, payment fail, từng ly lỗi/hoàn cần xử lý, chống xử lý trùng, reserve/consume, reload và báo cáo. Không đánh dấu toàn bộ AC tương ứng đã đạt: ưu đãi/HĐĐT/ZNS/rebrew/refund execution/Edge–Cloud thật chưa hỗ trợ. Các AC nền tảng khác vẫn unrun. Xem README để chạy lại và đọc giới hạn.

## Bằng chứng vertical slices vận hành và tài chính

`src/platform.test.ts`, `src/PlatformFlow.test.tsx` và `tests/platform-browser.cjs` kiểm một phần AC-SC-07.01/02 (incident→ticket→verified recovery/history), AC-SC-04.03 (capture/refund/sao kê/chênh lệch/chốt/bổ sung) và AC-X01/03/04/05 (luồng mua không hồi quy, quyền/scope/export/tổng hợp). Không đánh dấu toàn bộ Scenario đạt: camera/SLA, payroll/P&L, HĐĐT và tích hợp thật chưa làm. Xem [phạm vi, giả định và test](OPERATIONS_FINANCE_SLICES.md).
