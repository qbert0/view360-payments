# Module thanh toán View360

`TicketsModule` nhận `config: PaymentConfig`, `adapter: BookingAdapter` và thông tin Event khởi tạo tùy chọn. Module quản lý form, validation, trạng thái đang gửi/lỗi/kết quả, tóm tắt chi phí và liên kết checkout HTTPS.

Event không thuộc package này. Mỗi ứng dụng giữ component, nội dung và kiểu dữ liệu Event trong `features/events`.

## Đăng ký và thông báo

Adapter hiện tại gửi POST `/api/payments/bookings`. Server lấy site từ runtime config, kiểm tra vé/ngày/số khách và tự tính tổng. `price: null` là chờ báo giá; `0` mới là miễn phí. Request ID chống ghi trùng khi retry cùng nội dung. Thông báo thành công chỉ xuất hiện sau khi lưu thành công, không có nghĩa đã xác nhận lịch.

Local lưu file riêng tư tại `.data/bookings/<site>/`, không commit và không nằm trong public. API `/api/admin/bookings` đọc yêu cầu của site hiện tại, qua admin-auth hiện có. Chưa gửi email/SMS. Với production, cấu hình `NUXT_BOOKING_STORAGE_DIR` trỏ volume bền vững và `NUXT_ADMIN_KEY`; không dùng filesystem tạm của Vercel cho đơn thật. Khi chuyển sang database, thay lớp lưu server, giữ nguyên contract UI. File adapter phù hợp phát triển/single-server; chưa xử lý hạn mức chỗ/đồng bộ nhiều máy.

## Thanh toán

Module có trạng thái payment và checkout link do adapter server trả về. Hiện chưa tích hợp nhà cung cấp nên server từ chối vé giá lớn hơn 0 bằng 503. Hai site chỉ gửi yêu cầu chờ báo giá. Không dùng redirect quay lại trang hoặc dữ liệu client làm bằng chứng đã thanh toán.

Để bật thanh toán thật cần chọn cổng, credentials server, bảng đơn/thanh toán bền vững, tạo checkout từ tổng tiền server, webhook kiểm tra chữ ký và xử lý idempotent. Sau đó adapter trả `payment: pending` cùng `checkoutUrl`; thêm endpoint truy vấn trạng thái đã xác minh để hiển thị kết quả. Không đặt secret trong config client.
# view360-payments
