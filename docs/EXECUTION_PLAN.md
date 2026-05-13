# Execution Plan

File này dùng để giao việc cho Codex chạy tuần tự những task còn lại mà không cần hỏi lại từng bước.

Kế hoạch hiện tại chỉ còn tập trung vào top navbar.

## Cách dùng

Khi muốn chạy toàn bộ kế hoạch, nói:

```txt
Đọc docs/EXECUTION_PLAN.md và làm tuần tự tất cả task. Không hỏi lại trừ khi bị blocker thật sự.
```

Khi muốn chạy từ một task cụ thể, nói:

```txt
Đọc docs/EXECUTION_PLAN.md và bắt đầu từ Task 2.
```

## Agent Rules

- Làm tuần tự từ task đầu tiên được yêu cầu đến task cuối.
- Không hỏi lại nếu task đã đủ rõ để triển khai.
- Sau mỗi task phải chạy `npm run build`.
- Nếu build lỗi thì tự sửa trước khi chuyển sang task tiếp theo.
- Chỉ sửa file trong phạm vi task, trừ khi cần chỉnh import, route, type, style chung để build pass.
- Không refactor ngoài phạm vi nếu không giúp trực tiếp cho task hiện tại.
- Không xoá hoặc revert thay đổi ngoài phạm vi task.
- Không tích hợp API mới nếu task không yêu cầu.
- Nếu gặp blocker thật sự, dừng lại và báo rõ:
  - Task đang làm.
  - Blocker là gì.
  - Đã thử những gì.
  - Cần người dùng quyết định gì.
- Khi hoàn tất tất cả task, báo ngắn gọn:
  - Task đã hoàn thành.
  - File chính đã sửa.
  - Lệnh verify đã chạy.

## Project Context

- Top navbar được quản lý trong khu vực app shell.
- Các file khả năng cao cần sửa:

```txt
features/app-shell/shell-navigation.ts
features/app-shell/components/top-nav.tsx
features/app-shell/components/app-shell.module.css
shared/types/navigation.ts
```

- Route công cụ hiện có:

```txt
/apps/image-generator
/apps/video-generator
```

## Task 1: Đưa Tạo ảnh AI và Tạo video AI lên top navbar

Mục tiêu:
- Thêm 2 link công cụ quan trọng lên thanh navbar phía trên để người dùng vào nhanh:
  - `Tạo ảnh AI` -> `/apps/image-generator`
  - `Tạo video AI` -> `/apps/video-generator`
- Giữ `/apps` là trang thư viện tổng hợp, nhưng top navbar phải có shortcut trực tiếp tới 2 công cụ chính.

Phạm vi file:
- `features/app-shell/shell-navigation.ts`
- `features/app-shell/components/top-nav.tsx` nếu cần chỉnh render.
- `features/app-shell/components/app-shell.module.css` nếu cần chỉnh responsive/spacing.
- `shared/types/navigation.ts` nếu cần thêm key/type cho route mới.

Yêu cầu:
- Top navbar hiện tại đang có các mục như:
  - `Trang chủ`
  - `Ứng dụng AI`
  - `Tài nguyên`
  - `Chatbot`
  - `Bảng giá`
- Thêm 2 mục mới vào top navbar:
  - `Tạo ảnh AI`
  - `Tạo video AI`
- Thứ tự đề xuất:
  - `Trang chủ`
  - `Ứng dụng AI`
  - `Tạo ảnh AI`
  - `Tạo video AI`
  - `Tài nguyên`
  - `Chatbot`
  - `Bảng giá`
- Khi đang ở `/apps/image-generator`, link `Tạo ảnh AI` phải có active state.
- Khi đang ở `/apps/video-generator`, link `Tạo video AI` phải có active state.
- Không bắt buộc thêm 2 mục này vào sidebar nếu sidebar đã có `Ứng dụng AI` tổng hợp.
- Trên màn hình hẹp:
  - Navbar không được vỡ dòng xấu hoặc đè lên nút đăng nhập.
  - Nếu không đủ chỗ, cho phép cuộn ngang nhẹ hoặc ẩn bớt theo pattern hiện có của top nav.
  - Text không được tràn ra ngoài button/link.
- Giữ style top nav hiện tại:
  - Không đổi theme.
  - Không làm lại toàn bộ shell.
  - Không thêm icon nếu top nav hiện tại chỉ dùng text.

Không làm:
- Không xoá route `/apps`.
- Không đổi UI bên trong Image Generator hoặc Video Generator.
- Không đổi sidebar nếu không cần.
- Không thêm dropdown phức tạp nếu link trực tiếp đã đủ.

Done khi:
- Top navbar hiển thị `Tạo ảnh AI` và `Tạo video AI`.
- Click `Tạo ảnh AI` mở `/apps/image-generator`.
- Click `Tạo video AI` mở `/apps/video-generator`.
- Active state đúng trên từng route.
- Layout top navbar không vỡ ở desktop/tablet/mobile.
- `npm run build` pass.

## Task 2: QA responsive và build cuối

Mục tiêu:
- Kiểm tra top navbar sau khi thêm 2 link công cụ.

Phạm vi file:
- Các file đã sửa trong Task 1.

Yêu cầu:
- Chạy:

```bash
npm run build
```

- Nếu có thể, chạy local:

```bash
npm run dev
```

- Kiểm tra thủ công các viewport:
  - Desktop khoảng `1440px`.
  - Tablet khoảng `900px`.
  - Mobile khoảng `390px`.
- Kiểm tra các flow:
  - Mở `/apps`.
  - Click top navbar `Tạo ảnh AI` và xác nhận mở `/apps/image-generator`.
  - Click top navbar `Tạo video AI` và xác nhận mở `/apps/video-generator`.
  - Kiểm tra active state của `Tạo ảnh AI` trên `/apps/image-generator`.
  - Kiểm tra active state của `Tạo video AI` trên `/apps/video-generator`.
  - Kiểm tra top navbar không đè lên nút đăng nhập và không vỡ layout.

Không làm:
- Không push/deploy nếu người dùng chưa yêu cầu.

Done khi:
- `npm run build` pass.
- Layout navbar không vỡ ở desktop/tablet/mobile.
- Hai link mới điều hướng đúng route.
- Báo lại file đã sửa và phần đã verify.
