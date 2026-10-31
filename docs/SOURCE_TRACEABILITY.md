# Truy vết nguồn nghiệp vụ

Nguồn: `Ke_hoach_tong_the_MISA_CukCuk_Robot_Vending_Platform.xlsm`, bản người dùng tải lên; chỉ đọc dữ liệu ô, không chạy macro. Đây là bản chụp file, chưa đối chiếu thay đổi Google Sheets sau thời điểm xuất.

SHA-256: `b8863f3729c4a8867bbe0d2670e9386fc18ff188eb274c2b7f8b3fa302b8b6b3`.

## Quy tắc sử dụng

E2E-Overview mô tả kết quả xuyên hệ thống; Scenarios phân rã và ghi owner/ưu tiên/phiên bản; PBIs cung cấp nhu cầu chi tiết. Không mặc định sheet nào ghi đè sheet khác khi mâu thuẫn. Ô trống là chưa có dữ liệu, không phải “không cần làm”. Nhãn đáp ứng/tiến độ là khai báo trong kế hoạch, chưa được kiểm chứng ở repository.

Cột C (PBI ID) trống ở toàn bộ 58 dòng PBI. `PBIs!rN` dưới đây chỉ là định vị dòng nguồn, không phải PBI ID chính thức; khi nguồn đổi dòng phải đối chiếu lại tiêu đề. Không tự ghi ID mới vào workbook.

## E2E-Overview

| Nguồn | E2E | Luồng | Đầu vào | Đầu ra | Ngoại lệ | Nghiệm thu nguồn | Owner | Trạng thái nguồn |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E2E-Overview!r5 | E2E-01 | Triển khai và thiết lập điểm bán | Khách hàng/pháp nhân có robot và địa điểm kinh doanh | Robot được cấu hình đầy đủ, kết nối thành công và đủ điều kiện mở bán | Robot mất kết nối; chưa có BOM; thiếu nguyên liệu; cấu hình sai pháp nhân; không đồng bộ được menu/giá; thiết bị nhận cấu hình cũ; rollback thất bại | Một robot thật được khai báo từ Robot monitoring, nhận đúng cấu hình, chạy thử pha và có thể chuyển trạng thái sang sẵn sàng bán | S6 - Monitoring & Core | Đang thực hiện |
| E2E-Overview!r6 | E2E-02 | Bán hàng và pha chế tự động | Robot đủ điều kiện bán, khách chọn đồ uống | Khách nhận được đồ uống, giao dịch được ghi nhận và hóa đơn được xử lý đúng. | Khách hủy trước thanh toán; thanh toán treo; callback trùng; pha hỏng ly thứ hai trong đơn ba ly; máy hết nguyên liệu; robot offline; khách chưa nhận ly; ZNS lỗi; HĐĐT phát hành thất bại | Đơn ba ly khác nhau thanh toán thành công, pha đúng và có hóa đơn. Khi một ly lỗi, chỉ ly lỗi được xử lý pha lại hoặc hoàn tiền, không ảnh hưởng các ly khác | S2 - Kiosk | Đang thực hiện |
| E2E-Overview!r7 | E2E-03 | Quản lý kho và vận hành robot tại điểm bán | Dữ liệu bán hàng, tồn nguyên liệu, lịch bảo trì và tình trạng robot | Robot được cấp nguyên liệu, kiểm kê, vệ sinh, bảo trì và duy trì điều kiện hoạt động | Nhân viên không đến máy; giao thiếu nguyên liệu; kho không đủ hàng; kiểm kê lệch lớn; robot báo đủ tồn nhưng cảm biến báo hết; nguyên liệu quá hạn; máy cần khóa bán để bảo tr | Bán hàng làm thay đổi tồn dự kiến, hệ thống tạo nhu cầu tiếp hàng, nhân viên xác nhận cấp phát trên Ops App và tồn tại máy được cập nhật có nhật ký đối chiếu | S3 - CukCuk Web | Chưa thực hiện |
| E2E-Overview!r8 | E2E-04 | Quản trị kinh doanh & tài chính | Giao dịch bán, thanh toán, hoàn tiền, giá vốn, chi phí vận hành và chứng từ liên quan. | Chủ chuỗi biết máy nào đang lãi/lỗ, tiền đã về chưa và cần điều chỉnh hoạt động ở đâu | Giao dịch báo thành công nhưng ngân hàng không có tiền; hoàn tiền chưa thành công; thiếu chi phí; chưa có giá nhập; chênh lệch tồn; hóa đơn lỗi; dữ liệu nhiều pháp nhân bị cộng nhầm | Chọn một máy và một kỳ báo cáo, truy vết được doanh thu, hoàn tiền, giá vốn, chi phí, lợi nhuận và các chênh lệch đối soát về giao dịch/chứng từ nguồn | S3 - CukCuk Web | Chưa thực hiện |
| E2E-Overview!r9 | E2E-05 | Mua hàng & công nợ nhà cung cấp | Nhu cầu nguyên vật liệu và thông tin nhà cung cấp. | Có đủ hàng để vận hành; quản lý được công nợ, chi phí mua hàng | Nhận hàng nhiều lần; nhận thiếu; hóa đơn và PO chênh lệch; thanh toán công nợ một phần; | Một PO nhận hàng hai lần và thanh toán một phần vẫn cho ra tồn kho, công nợ và tuổi nợ đúng | S3 - CukCuk Web | Chưa thực hiện |
| E2E-Overview!r10 | E2E-06 | Quản lý nhân sự vận hành | Kế hoạch vận hành máy, nhu cầu nhân sự | Có đủ nhân viên để vận hành; quản lý được chi phí lao động | Nhân viên vắng ca; đổi ca; chấm công sai vị trí; dữ liệu công bị đồng bộ trùng | Một nhân viên làm việc tại máy có thể ghi nhận công và phát sinh dữ liệu tính lương/chi phí | S3 - CukCuk Web | Chưa thực hiện |
| E2E-Overview!r11 | E2E-07 | Giám sát, hỗ trợ và xử lý sự cố | Sự kiện thiết bị, giao dịch, hóa đơn, tích hợp, công việc hiện trường hoặc cảnh báo camera | Sự cố được phát hiện, có người chịu trách nhiệm, được xử lý an toàn và có thể truy vết | Sự cố không được nhận; mất mạng nên không có telemetry; ticket quá SLA; mất quyền ủy quyền; restart khi đang pha; OTA lỗi; camera mất kết nối; hỗ trợ nhầm pháp nhân | Mô phỏng một robot offline, hệ thống phát hiện, tạo cảnh báo/ticket, phân công xử lý, cho phép kỹ thuật can thiệp đúng quyền và lưu đầy đủ nhật ký thao tác | S6 - Monitoring & Core | Chưa thực hiện |

## Scenarios

| Nguồn | E2E | Scenario | Nhu cầu | Kết quả nghiệm thu | Bộ phận | Owner | Phối hợp | Ưu tiên | Gate | Phiên bản | Số PBI nguồn |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scenarios!r12 | E2E-01 | SC-01.01 | Khởi tạo pháp nhân, điểm bán và kết nối robot | Pháp nhân, điểm đặt và robot được khai báo; thiết bị kết nối đúng | CukCuk Web | S3 - CukCuk Web | S1 - Edge & Robot, S6 - Monitoring & Core | P0 | G1 | RC1 | 3 |
| Scenarios!r13 | E2E-01 | SC-01.02 | Thiết lập kinh doanh và các dịch vụ tích hợp | Menu, giá, BOM, tài khoản nhận tiền, thuế và các dịch vụ được cấu hình đúng | CukCuk Web | S3 - CukCuk Web | S1 - Edge & Robot, S2 - Kiosk, "S4 - Tích hợp (HR, KT,...)", S6 - Monitoring & Core | P0 | G1, G3 | RC1 | 5 |
| Scenarios!r14 | E2E-01 | SC-01.03 | Kiểm tra điều kiện sẵn sàng và mở bán | Cấu hình được đồng bộ; robot được kích hoạt/khóa bán đúng điều kiện | Phòng Robotic | S1 - Edge & Robot | S2 - Kiosk, S3 - CukCuk Web, S6 - Monitoring & Core | P0 | G1 | RC1 | 2 |
| Scenarios!r15 | E2E-02 | SC-02.01 | Khách mua một ly đồ uống thành công | Thanh toán đúng, robot pha đúng, khách nhận ly và có HĐĐT | CukCuk Mobile | S2 - Kiosk | S1 - Edge & Robot, S3 - CukCuk Web, "S4 - Tích hợp (HR, KT,...)", S6 - Monitoring & Core | P0 | G1 | RC1 | 4 |
| Scenarios!r16 | E2E-02 | SC-02.02 | Khách mua nhiều ly trong một đơn | Nhiều ly được pha theo hàng đợi, trạng thái độc lập, không nhầm ly | CukCuk Mobile | S2 - Kiosk | S1 - Edge & Robot, "S4 - Tích hợp (HR, KT,...)" | P0 | G1 | RC1 | 2 |
| Scenarios!r17 | E2E-02 | SC-02.03 | Xử lý pha lỗi và hoàn tiền | Chỉ ly lỗi được pha lại hoặc hoàn tiền, không ảnh hưởng ly khác | CukCuk Mobile | S1 - Edge & Robot | S2 - Kiosk, "S4 - Tích hợp (HR, KT,...)" | P0 | G1 | RC2 | 2 |
| Scenarios!r18 | E2E-02 | SC-02.04 | Xử lý thanh toán lỗi, mất kết nối và phục hồi | Không mất đơn đã thanh toán, không pha/hoàn tiền trùng | CukCuk Mobile | S1 - Edge & Robot | S2 - Kiosk, "S4 - Tích hợp (HR, KT,...)", S6 - Monitoring & Core | P0 | G1 | RC2 | 2 |
| Scenarios!r19 | E2E-03 | SC-03.01 | Theo dõi tiêu hao và tồn nguyên liệu tại robot | Order làm thay đổi tồn dự kiến; cảnh báo tồn thấp | CukCuk Mobile | S3 - CukCuk Web | S1 - Edge & Robot, S2 - Kiosk | P0 | G2 | RC1 | 2 |
| Scenarios!r20 | E2E-03 | SC-03.02 | Lập kế hoạch cấp phát và tiếp hàng tại robot | Từ nhu cầu thiếu hàng → duyệt → xuất kho → Ops tiếp hàng → cập nhật tồn | CukCuk Mobile | S3 - CukCuk Web | S1 - Edge & Robot, S5 - Ops App | P2 | G2 | RC2 | 2 |
| Scenarios!r21 | E2E-03 | SC-03.03 | Kiểm kê và xử lý chênh lệch nguyên liệu | Đối chiếu được tồn hệ thống và thực tế, điều chỉnh có chứng từ | CukCuk Mobile | S3 - CukCuk Web | S5 - Ops App | P1 | G2 | RC2 | 2 |
| Scenarios!r22 | E2E-03 | SC-03.04 | Vệ sinh, bảo trì và duy trì điều kiện hoạt động | Nhân viên hoàn thành checklist, máy được xác nhận đủ điều kiện bán | CukCuk Mobile | S5 - Ops App | S1 - Edge & Robot, S3 - CukCuk Web, S6 - Monitoring & Core | P0 | G3 | RC2 | 2 |
| Scenarios!r23 | E2E-04 | SC-04.01 | Tổng hợp doanh thu, giá vốn và tính lãi/lỗ | P&L theo máy/nhóm/chuỗi/pháp nhân truy vết được dữ liệu nguồn | CukCuk Web | S3 - CukCuk Web | S2 - Kiosk, "S4 - Tích hợp (HR, KT,...)" | P0 | G2 | RC3 | 2 |
| Scenarios!r24 | E2E-04 | SC-04.02 | Ghi nhận và phân bổ chi phí kinh doanh | Chi phí nhân công, mặt bằng, giao dịch, khấu hao được phân bổ đúng | CukCuk Web | S3 - CukCuk Web | "S4 - Tích hợp (HR, KT,...)", S5 - Ops App | P1 | G2 | RC3 | 2 |
| Scenarios!r25 | E2E-04 | SC-04.03 | Đối soát thanh toán, hoàn tiền và hóa đơn | Giao dịch khớp với PSP/ngân hàng/HĐĐT; chênh lệch được nhận diện | CukCuk Web | S3 - CukCuk Web | S2 - Kiosk, "S4 - Tích hợp (HR, KT,...)" | P0 | G2 | RC3 | 2 |
| Scenarios!r26 | E2E-04 | SC-04.04 | Phân tích hiệu quả kinh doanh từng robot và toàn chuỗi | Có dashboard, biên lợi nhuận, hòa vốn, xếp hạng máy và báo cáo | CukCuk Web | S3 - CukCuk Web | "S4 - Tích hợp (HR, KT,...)", S6 - Monitoring & Core | P1 | G3 | RC3 | 2 |
| Scenarios!r27 | E2E-05 | SC-05.01 | Lập kế hoạch mua hàng và đặt mua nhà cung cấp | Từ dự báo thiếu hàng → đề nghị mua → PO được duyệt | CukCuk Web | S3 - CukCuk Web | S3 - CukCuk Web | P2 | G2 | RC3 | 3 |
| Scenarios!r28 | E2E-05 | SC-05.02 | Tiếp nhận hàng mua và nhập kho | Nhận hàng một/nhiều lần, kiểm tra và cập nhật tồn kho đúng | CukCuk Web | S3 - CukCuk Web | S3 - CukCuk Web | P2 | G2 | RC3 | 2 |
| Scenarios!r29 | E2E-05 | SC-05.03 | Đối chiếu hóa đơn, công nợ và thanh toán NCC | PO – nhận hàng – hóa đơn khớp; theo dõi và thanh toán AP đúng | CukCuk Web | S3 - CukCuk Web | "S4 - Tích hợp (HR, KT,...)" | P2 | G2 | RC3 | 2 |
| Scenarios!r30 | E2E-05 | SC-05.04 | Báo cáo mua hàng và quản lý nhà cung cấp | Báo cáo theo NCC/NVL/kỳ, giá mua, tuổi nợ và cảnh báo | CukCuk Web | S3 - CukCuk Web | "S4 - Tích hợp (HR, KT,...)" | P2 | G3 | RC3 | 1 |
| Scenarios!r31 | E2E-06 | SC-06.01 | Thiết lập nhân viên, ca làm và tuyến vận hành | Nhân viên được phân quyền, bố trí ca/tuyến và đồng bộ lịch đến Ops App | CukCuk Web | S4 - Tích hợp (HR, KT,...) | S5 - Ops App, S6 - Monitoring & Core | P1 | G3 | RC3 | 1 |
| Scenarios!r32 | E2E-06 | SC-06.02 | Thực hiện công việc và ghi nhận chấm công | Check-in/out đúng máy, ca và nhân viên; có bằng chứng hoàn thành việc | CukCuk Web | S5 - Ops App | S3 - CukCuk Web, "S4 - Tích hợp (HR, KT,...)" | P1 | G3 | RC2 | 2 |
| Scenarios!r33 | E2E-06 | SC-06.03 | Duyệt công, tính lương và phân bổ chi phí nhân sự | Bảng công, lương/AMIS và chi phí nhân công theo máy được đối chiếu | CukCuk Web | S4 - Tích hợp (HR, KT,...) | S3 - CukCuk Web, S5 - Ops App | P2 | G3 | RC2 | 2 |
| Scenarios!r34 | E2E-07 | SC-07.01 | Giám sát toàn chuỗi và phát hiện cảnh báo | Theo dõi tình trạng robot, cảnh báo đúng mức độ | Phòng Robotic | S6 - Monitoring & Core | S1 - Edge & Robot, S2 - Kiosk, S3 - CukCuk Web, "S4 - Tích hợp (HR, KT,...)" | P0 | G3 | RC2 | 3 |
| Scenarios!r35 | E2E-07 | SC-07.02 | Tiếp nhận và xử lý sự cố tại robot | Ticket được phân công, xử lý hiện trường, có bằng chứng và SLA | Phòng Robotic | S6 - Monitoring & Core | S1 - Edge & Robot, S5 - Ops App | P0 | G3 | RC2 | 3 |
| Scenarios!r36 | E2E-07 | SC-07.03 | Hỗ trợ kỹ thuật từ xa và khôi phục hoạt động | Thao tác đúng quyền/ủy quyền, robot được khôi phục, có audit | Phòng Robotic | S6 - Monitoring & Core | S1 - Edge & Robot, "S4 - Tích hợp (HR, KT,...)" | P0 | G3 | RC3 | 1 |
| Scenarios!r37 | E2E-07 | SC-07.04 | Cập nhật OTA, rollback và kiểm soát vận hành | Cập nhật an toàn theo đợt, có xác nhận và rollback khi lỗi | Phòng Robotic | S1 - Edge & Robot | S6 - Monitoring & Core | P0 | G3 | RC3 | 2 |

## PBIs — giữ nguyên tiêu đề nguồn

| Nguồn tạm | E2E | Scenario | PBI ID nguồn | Tiêu đề nguyên văn | Thực trạng nguồn | Phiên bản nguồn |
| --- | --- | --- | --- | --- | --- | --- |
| PBIs!r5 | E2E-01 | SC-01.01 | — | Admin MISA muốn khai báo danh mục hãng sản xuất, model trên Web Monitor để chuẩn hóa dữ liệu thiết bị robot trên toàn hệ thống |  Chưa đáp ứng | RC1 |
| PBIs!r6 | E2E-01 | SC-01.01 | — | Admin MISA muốn khai báo hồ sơ máy theo số Serial và gán cho khách hàng (Tenant) trên Web Monitor để bàn giao quyền quản lý thiết bị cho đơn vị vận hành |  Chưa đáp ứng | RC1 |
| PBIs!r7 | E2E-01 | SC-01.01 | — | Quản lý nhà hàng muốn kết nối với robot trên Web CukCuk quản lý để thiết lập thông tin trên robot |  Chưa đáp ứng | RC1 |
| PBIs!r8 | E2E-01 | SC-01.02 | — | Quản lý nhà hàng muốn đồng bộ thực đơn và công thức gốc từ máy Robot (Có sẵn) trên Web CukCuk để hiển thị đúng thực đơn trên Kiosk |  Chưa đáp ứng | RC1 |
| PBIs!r9 | E2E-01 | SC-01.02 | — | Kế toán nhà hàng muốn thiết lập tài khoản thanh toán (Tài khoản ngân hàng/Ví điện tử/Thẻ) cho điểm bán để thu tiền và đối soát được kết quả giao dịch của khách hàng | Đã đáp ứng | RC1 |
| PBIs!r10 | E2E-01 | SC-01.02 | — | Kế toán nhà hàng muốn thiết lập kết nối MISA meInvoice cho từng điểm bán để xuất hóa đơn điện tử tự động | Đã đáp ứng | RC1 |
| PBIs!r11 | E2E-01 | SC-01.02 | — | Quản lý nhà hàng muốn cấu hình giao diện hiển thị, video quảng cáo và âm thanh thông báo (TTS) cho Kiosk trên Web CukCuk quản lý để tăng độ nhận diện thương hiệu và phục vụ cho quá trình order của khách hàng |  Chưa đáp ứng | RC1 |
| PBIs!r12 | E2E-01 | SC-01.02 | — | Quản lý nhà hàng muốn tạo tài khoản nhân viên và phân quyền theo từng điểm máy Kiosk trên Web CukCuk quản lý để kiểm soát đúng người thực hiện vận hành, bảo dưỡng và xem báo cáo kết quả làm việc của từng nhân viên | Đáp ứng một phần | RC1 |
| PBIs!r13 | E2E-01 | SC-01.03 | — | Nhân viên vận hành muốn nạp nguyên liệu ban đầu, kiểm tra cảm biến và chạy lệnh pha thử (Test drink) tại máy để đảm bảo máy hoạt động ổn định, an toàn trước khi mở bán |  Chưa đáp ứng | RC1 |
| PBIs!r14 | E2E-01 | SC-01.03 | — | Quản lý nhà hàng muốn kiểm tra điều kiện sẵn sàng của thiết bị và kích hoạt trạng thái mở bán cho Kiosk để khách hàng bắt đầu order |  Chưa đáp ứng | RC1 |
| PBIs!r15 | E2E-02 | SC-02.01 | — | Khách hàng muốn xem thực đơn trực quan (chỉ cho chọn món còn nguyên liệu) và chọn đồ uống trên màn hình Kiosk để đặt nhanh món mình yêu thích | Đã đáp ứng | RC1 |
| PBIs!r16 | E2E-02 | SC-02.01 | — | Khách hàng muốn nhập mã ưu đãi nhận từ Zalo OA/MISA Lomas trên Kiosk để được giảm giá đơn hàng và cá nhân hóa quá trình trả món theo tên riêng bằng âm thanh, tin nhắn | Đáp ứng một phần | RC1 |
| PBIs!r17 | E2E-02 | SC-02.01 | — | Khách hàng muốn theo dõi tiến độ pha chế trên màn hình phụ và nhận thông báo giọng nói (TTS) kèm tin nhắn Zalo ZNS khi hoàn tất để lấy đúng đồ uống tại cửa nhận đồ | Đã đáp ứng | RC1 |
| PBIs!r18 | E2E-02 | SC-02.01 | — | Khách hàng muốn quét mã QR để tự nhập thông tin xuất hóa đơn điện tử trên điện thoại trong lúc chờ pha chế để nhận hóa đơn về Email mà không làm chậm việc nhận nước |  Chưa đáp ứng | RC1 |
| PBIs!r19 | E2E-02 | SC-02.02 | — | Khách hàng muốn trong 1 lần order có thể chọn nhiều món để trả tiền trong một lần thao tác | Đã đáp ứng | RC1 |
| PBIs!r20 | E2E-02 | SC-02.02 | — | Khách hàng mua đơn nhiều ly muốn theo dõi tiến độ hoàn thành của từng ly (1/N) và nhận thông báo lấy từng ly tại ô nhận đồ để không lấy nhầm hoặc bỏ sót đồ uống | Đã đáp ứng | RC1 |
| PBIs!r21 | E2E-02 | SC-02.03 | — | Hệ thống muốn tự động phát hiện lỗi pha chế từ Robot, khóa món đang lỗi trên Kiosk và gửi cảnh báo cho nhân viên để ngăn khách tiếp theo đặt vào món đang gặp sự cố |  Chưa đáp ứng | — |
| PBIs!r22 | E2E-02 | SC-02.03 | — | Khách hàng gặp sự cố pha chế lỗi muốn được hoàn tiền tự động theo số ly lỗi hoặc nhận mã pha bù để đảm bảo quyền lợi tài chính |  Chưa đáp ứng | — |
| PBIs!r23 | E2E-02 | SC-02.04 | — | Khách hàng muốn tạo lại mã QR khi hết hạn hoặc kiểm tra lại trạng thái giao dịch khi mạng chậm phản hồi để không bị trừ tiền hai lần cho một đơn hàng | Đã đáp ứng | — |
| PBIs!r24 | E2E-02 | SC-02.04 | — | Hệ thống Kiosk muốn lưu tạm dữ liệu đơn hàng tại máy (Edge) khi mất mạng Internet và tự đồng bộ lên Cloud khi có mạng lại để không thất thoát dữ liệu doanh thu |  Chưa đáp ứng | — |
| PBIs!r25 | E2E-03 | SC-03.01 | — | Hệ thống muốn tự động trừ tồn kho lý thuyết theo định mức BOM sau mỗi ly pha chế thành công để theo dõi lượng nguyên liệu còn lại tại từng máy | Đáp ứng một phần | — |
| PBIs!r26 | E2E-03 | SC-03.01 | — | Hệ thống muốn đồng bộ chỉ số cảm biến nguyên liệu từ Robot và phát cảnh báo khi chạm ngưỡng sắp hết để tự động khóa món hết hàng và nhắc nhân viên đi tiếp nguyên liệu |  Chưa đáp ứng | — |
| PBIs!r27 | E2E-03 | SC-03.02 | — | Quản lý kho muốn lập phiếu đề xuất cấp phát và xuất kho điều chuyển nguyên vật liệu từ kho tổng sang kho Kiosk trên Web CukCuk để chuẩn bị hàng cho nhân viên đi nạp | Đã đáp ứng | — |
| PBIs!r28 | E2E-03 | SC-03.02 | — | Nhân viên vận hành muốn ghi nhận số lượng nguyên liệu thực nạp vào từng bình chứa trên App Vận hành để cập nhật tồn kho máy Robot và mở khóa lại các món đã hết |  Chưa đáp ứng | — |
| PBIs!r29 | E2E-03 | SC-03.03 | — | Nhân viên vận hành muốn nhập số lượng tồn kho kiểm đếm thực tế tại máy vào cuối ca trên App Vận hành để đối chiếu với số tồn dự kiến trên hệ thống |  Chưa đáp ứng | — |
| PBIs!r30 | E2E-03 | SC-03.03 | — | Kế toán kho muốn phê duyệt biên bản kiểm kê và sinh phiếu điều chỉnh hao hụt nguyên vật liệu trên Web CukCuk quản lý để chốt số liệu tồn kho thực tế |  Chưa đáp ứng | — |
| PBIs!r31 | E2E-03 | SC-03.04 | — | Nhân viên vận hành muốn thực hiện checklist vệ sinh định kỳ, chạy lệnh sục rửa đường ống (Pipe line clean) và chụp ảnh nghiệm thu trên App Vận hành để đảm bảo vệ sinh an toàn thực phẩm |  Chưa đáp ứng | — |
| PBIs!r32 | E2E-03 | SC-03.04 | — | Nhân viên vận hành muốn bật chế độ tạm ngưng bán trên App Vận hành trong lúc vệ sinh bảo trì và mở bán lại sau khi hoàn tất để khách hàng không đặt đơn khi máy đang được bảo dưỡng |  Chưa đáp ứng | — |
| PBIs!r33 | E2E-04 | SC-04.01 | — | Kế toán muốn hệ thống tự động tổng hợp doanh thu bán hàng thuần (sau chiết khấu và hoàn tiền) theo từng máy và từng ngày trên Web CukCuk để ghi nhận doanh thu chính xác |  Chưa đáp ứng | — |
| PBIs!r34 | E2E-04 | SC-04.01 | — | Kế toán muốn hệ thống tự động tính giá vốn hàng bán (COGS) theo lượng nguyên liệu tiêu hao để xác định lợi nhuận gộp |  Chưa đáp ứng | — |
| PBIs!r35 | E2E-04 | SC-04.02 | — | Kế toán muốn ghi nhận các khoản chi phí trực tiếp phát sinh tại từng điểm máy (thuê mặt bằng, điện, mạng, hao hụt) trên Web CukCuk quản lý để theo dõi chi phí vận hành của từng Kiosk |  Chưa đáp ứng | — |
| PBIs!r36 | E2E-04 | SC-04.02 | — | Kế toán muốn thiết lập tiêu thức phân bổ chi phí chung (nhân công vận hành, khấu hao robot, bảo trì) cho từng máy trên Web CukCuk quản lý để tính đúng tổng chi phí trên mỗi điểm bán |  Chưa đáp ứng | — |
| PBIs!r37 | E2E-04 | SC-04.03 | — | Kế toán thanh toán muốn hệ thống tự động đối soát dữ liệu 3 bên giữa Đơn hàng CukCuk, Sao kê cổng thanh toán/ngân hàng và Hóa đơn điện tử để phát hiện ngay các giao dịch lệch |  Chưa đáp ứng | — |
| PBIs!r38 | E2E-04 | SC-04.03 | — | Kế toán muốn xem danh sách các giao dịch chênh lệch hoặc treo hoàn tiền và thực hiện xử lý tất toán trên Web CukCuk để khớp dữ liệu thu chi thực tế |  Chưa đáp ứng | — |
| PBIs!r39 | E2E-04 | SC-04.04 | — | Quản lý nhà hàng muốn xem báo cáo kết quả kinh doanh (P&L) và điểm hòa vốn (BEP) chi tiết theo từng máy (Chi nhánh) trên Web CukCuk để đánh giá hiệu quả đầu tư của từng điểm đặt Kiosk |  Chưa đáp ứng | — |
| PBIs!r40 | E2E-04 | SC-04.04 | — | Quản lý nhà hàng muốn xem các biểu đồ thống kê doanh thu, số ly bán và lợi nhuận theo thời gian thực trên App CukCuk Quản lý để nắm bắt nhanh tình hình kinh doanh mọi lúc mọi nơi | Đáp ứng một phần | — |
| PBIs!r41 | E2E-05 | SC-05.01 | — | Nhân viên mua hàng muốn hệ thống tự động gợi ý số lượng nguyên vật liệu cần mua dựa trên tốc độ tiêu hao của chuỗi Kiosk và mức tồn tối thiểu để không bị đứt gãy nguồn cung |  Chưa đáp ứng | — |
| PBIs!r42 | E2E-05 | SC-05.01 | — | Nhân viên mua hàng muốn hệ thống tự động dự báo số lượng nguyên vật liệu cần mua dựa trên các dữ liệu bán hàng cùng kỳ để đáp ứng được nhu cầu thực tế |  Chưa đáp ứng | — |
| PBIs!r43 | E2E-05 | SC-05.01 | — | Quản lý mua hàng muốn lập và phê duyệt Đơn đặt hàng nhà cung cấp (PO) trên Web CukCuk để kiểm soát số lượng, đơn giá và ngân sách mua sắm trước khi gửi nhà cung cấp | — | — |
| PBIs!r44 | E2E-05 | SC-05.02 | — | Quản lý kho tổng muốn kiểm nhận hàng giao theo đơn đặt hàng (PO), cập nhật số lô/hạn sử dụng (Lot/FEFO) và lập phiếu nhập kho để quản lý chất lượng nguyên vật liệu đầu vào | — | — |
| PBIs!r45 | E2E-05 | SC-05.02 | — | Quản lý kho tổng muốn ghi nhận biên bản hàng giao thiếu hoặc lập phiếu xuất trả lại hàng lỗi cho nhà cung cấp để chỉ nhập kho những lô hàng đạt tiêu chuẩn | — | — |
| PBIs!r46 | E2E-05 | SC-05.03 | — | Kế toán muốn đối chiếu bộ chứng từ 3 bên (Đơn mua hàng PO - Phiếu nhập kho - Hóa đơn NCC) và ghi nhận công nợ phải trả để đảm bảo chỉ thanh toán đúng lượng hàng thực nhận | — | — |
| PBIs!r47 | E2E-05 | SC-05.03 | — | Kế toán muốn theo dõi nợ đến hạn, lập đề nghị thanh toán và hạch toán chi tiền nhà cung cấp để thanh toán đúng hạn và đồng bộ sổ sách kế toán | — | — |
| PBIs!r48 | E2E-05 | SC-05.04 | — | Quản lý nhà hàng muốn xem báo cáo biến động giá mua và đánh giá chất lượng giao hàng của từng nhà cung cấp trên Web CukCuk để tối ưu chi phí đầu vào | — | — |
| PBIs!r49 | E2E-06 | SC-06.01 | — | Quản lý nhà hàng muốn thiết lập ca làm việc và phân máy phụ trách cho từng nhân viên trên Web CukCuk quản lý để đảm bảo mọi Kiosk đều có người phụ trách vận hành | — | — |
| PBIs!r50 | E2E-06 | SC-06.02 | — | Nhân viên vận hành muốn thực hiện Check-in/Check-out bằng GPS và quét mã QR tại máy kèm ảnh chụp bằng chứng trên App Vận hành để ghi nhận công làm việc thực tế tại điểm bán | — | — |
| PBIs!r51 | E2E-06 | SC-06.02 | — | Quản lý nhà hàng muốn nhận cảnh báo khi nhân viên không xử lý vận hành tại các Kiosk có vấn đề để kịp thời điều phối nhân sự thay thế | — | — |
| PBIs!r52 | E2E-06 | SC-06.03 | — | Quản lý nhà hàng muốn rà soát và đối chiếu kết quả làm việc của nhân viên trên Web CukCuk để làm căn cứ tính lương chính xác | — | — |
| PBIs!r53 | E2E-06 | SC-06.03 | — | Kế toán muốn đồng bộ dữ liệu công sang hệ thống tính lương và phân bổ chi phí nhân sự cho từng máy Kiosk để hạch toán đúng chi phí lao động | — | — |
| PBIs!r54 | E2E-07 | SC-07.01 | — | Nhân viên MISA muốn theo dõi bản đồ toàn bộ máy Kiosk và trạng thái hoạt động (Online/Offline/Đang pha/Lỗi) theo thời gian thực trên Web Monitor để kiểm soát vận hành toàn cục | — | — |
| PBIs!r55 | E2E-07 | SC-07.01 | — | Nhân viên MISA muốn xem hình ảnh Camera tại Kiosk và nhận cảnh báo khi có va đập hoặc xâm nhập bất thường để đảm bảo an ninh tài sản tại điểm bán | — | — |
| PBIs!r56 | E2E-07 | SC-07.01 | — | Hệ thống giám sát muốn tự động phân loại mức độ nghiêm trọng của mã lỗi từ Robot và khởi tạo Ticket sự cố tự động để điều phối đúng bộ phận kỹ thuật xử lý | — | — |
| PBIs!r57 | E2E-07 | SC-07.02 | — | Nhân viên vận hành nhà hàng muốn nhận cảnh báo sự cố trên App Vận hành kèm hướng dẫn khắc phục để kiểm soát tình hình, nhanh chóng di chuyển đến Kiosk xử lý lỗi tại chỗ | — | — |
| PBIs!r58 | E2E-07 | SC-07.02 | — | Nhân viên vận hành nhà hàng muốn nhận thông báo Ticket sự cố trên App Vận hành kèm hướng dẫn khắc phục để nhanh chóng di chuyển đến Kiosk xử lý lỗi tại chỗ | — | — |
| PBIs!r59 | E2E-07 | SC-07.02 | — | Nhân viên vận hành muốn cập nhật nguyên nhân lỗi, linh kiện thay thế và hình ảnh sau khắc phục để đóng Ticket trên App Vận hành nhằm lưu trữ lịch sử bảo trì thiết bị | — | — |
| PBIs!r60 | E2E-07 | SC-07.03 | — | Nhân viên MISA muốn truy xuất nhật ký thiết bị (DeviceLogs/DebugLogs/IO Control) và gửi lệnh điều khiển (Start/Stop/Pause/Restore) từ xa trên Web Monitor để khắc phục nhanh các lỗi phần mềm mà không cần đến tận nơi | — | — |
| PBIs!r61 | E2E-07 | SC-07.04 | — | Nhân viên MISA muốn quản lý phiên bản phần mềm/firmware và lên lịch cập nhật từ xa (OTA) cho các máy Kiosk vào khung giờ thấp điểm để nâng cấp tính năng mà không làm gián đoạn việc bán hàng | — | — |
| PBIs!r62 | E2E-07 | SC-07.04 | — | Hệ thống cập nhật OTA muốn tự động khôi phục (Rollback) về phiên bản ổn định trước đó nếu quá trình nâng cấp gặp lỗi để thiết bị không bị treo khi vận hành | — | — |

## Điểm cần xác minh

- 7 E2E, 26 Scenario và 58 PBI có nội dung; tổng số PBI khai báo ở Scenarios cần đối chiếu với danh sách chi tiết, không lấy con số tiến độ làm bằng chứng nghiệm thu.
- PBIs chỉ có phiên bản RC1 ở r5–20; r21–62 chưa có phiên bản. RC2/RC3 ở Scenario là bối cảnh lập kế hoạch, không tự điền thành phiên bản của từng PBI.
- SC-06.01 ghi RC3 nhưng SC-06.02/03 ghi RC2 dù phụ thuộc ca/nhân viên; cần xác nhận thứ tự bàn giao.
- PBIs!r57/r58 có nội dung gần nhau (cảnh báo và thông báo ticket); giữ cả hai, cần xác nhận gộp hay tách, không đếm là hai chức năng đã duyệt độc lập.
- E2E-01 nghiệm thu robot thật, E2E-02 có dịch vụ thật; nhiệm vụ hiện tại chỉ thiết kế và giả lập. Kết quả mock không thay nghiệm thu phần cứng/tích hợp thực.
- “Máy (Chi nhánh)” ở PBIs!r39 không khớp hoàn toàn bối cảnh một điểm bán nhiều robot. Giữ Site và Robot riêng, cần thống nhất thuật ngữ Chi nhánh.
- Chưa có quy tắc tính thuế, giá vốn, phân bổ, giới hạn ưu đãi, thời điểm ghi nhận doanh thu, SLA, lưu trữ camera/GPS, thẩm quyền hoàn tiền/tất toán/ủy quyền. Không biến đề xuất thiết kế thành quy định đã xác nhận.
