# Execution Plan

File này dùng để giao việc cho Codex chạy tuần tự nhiều task mà không cần hỏi lại từng bước.

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
- Nếu gặp blocker thật sự, dừng lại và báo rõ:
  - Task đang làm.
  - Blocker là gì.
  - Đã thử những gì.
  - Cần người dùng quyết định gì.
- Khi hoàn tất tất cả task, báo ngắn gọn:
  - Task đã hoàn thành.
  - File chính đã sửa.
  - Lệnh verify đã chạy.

## Project Conventions

- App tổng hợp công cụ nằm tại route `/apps`.
- Mỗi công cụ con có route riêng dưới `/apps/<tool-name>`.
- Mỗi công cụ con có code riêng dưới:

```txt
features/apps/tools/<tool-name>/
```

- Không nhét nhiều công cụ vào cùng một component lớn.
- Danh sách ứng dụng được khai báo tại:

```txt
features/apps/apps.data.ts
```

- Component thư viện ứng dụng nằm tại:

```txt
features/apps/components/apps-library.tsx
```

- Icon dùng chung cho nhóm apps nằm tại:

```txt
features/apps/components/apps-icons.tsx
```

## Task Template

Copy template này để thêm task mới:

```md
## Task N: Tên task

Mục tiêu:
- ...

Phạm vi file:
- `...`

Yêu cầu:
- ...

Không làm:
- ...

Done khi:
- `npm run build` pass.
- ...
```

## Task 2: Thêm Video Generator

Mục tiêu:
- Thêm route `/apps/video-generator`.
- Tạo cấu trúc code riêng cho công cụ tạo video.
- Xây dựng giao diện giống bố cục tham chiếu: panel cấu hình bên trái, preview video ở giữa, lịch sử/danh sách video bên phải.
- Giao diện chủ đạo phải là màu sáng theo theme hiện tại, không dùng nền tối toàn màn hình.

Phạm vi file:
- `app/apps/video-generator/page.tsx`
- `features/apps/apps.data.ts`
- `features/apps/tools/video-generator/components/video-generator-main-body.tsx`
- `features/apps/tools/video-generator/components/video-generator-main-body.module.css`

Yêu cầu:
- Tạo màn UI có thể sử dụng được, không phải landing page.
- Layout desktop gồm 3 vùng:
  - Left panel: cấu hình tạo video.
  - Center panel: preview video lớn và danh sách kết quả.
  - Right panel: lịch sử video đã tạo.
- Left panel:
  - Tabs: `Tạo Video`, `Edit Video`, `Motion Control`.
  - Segment: `Khung hình`, `Thành phần`.
  - 2 ô upload frame: `Khung bắt đầu` bắt buộc và `Khung kết thúc` tuỳ chọn.
  - Textarea `Mô tả`.
  - Select/chip cho `Model`, `Tỷ lệ`, `Thời lượng`.
  - Nút chính `Tạo video`.
- Center panel:
  - Top actions: `Lịch sử`, `Hướng dẫn sử dụng`, switch view `Danh sách` / `Lưới`.
  - Preview video lớn tỉ lệ 16:9 hoặc 9:16 tuỳ setting, đặt trong khung sáng.
  - Có nút play giả lập ở giữa preview.
  - Có action icon ở góc preview: tải xuống, xoá.
  - Khi người dùng bấm `Tạo video`, thêm 1 item video mới lên đầu danh sách preview/history.
- Right panel:
  - Hiển thị danh sách video đã tạo.
  - Mỗi item có model, prompt ngắn, thumbnail, metadata: thời lượng, tỉ lệ, chất lượng, ngày tạo.
  - Trạng thái rỗng phải đẹp, không để panel trống.
- Màu sắc:
  - Nền tổng thể dùng `var(--surface-soft)` hoặc trắng sáng.
  - Panel dùng `#ffffff`, viền nhẹ `rgba(0, 27, 68, 0.08)`.
  - Text chính dùng `var(--navy)`, text phụ dùng `var(--muted)`.
  - CTA dùng `var(--navy)` hoặc accent tím hiện có, không dùng nền tối full screen.
- Responsive:
  - Desktop: 3 cột.
  - Tablet: left panel và center xếp 2 cột, history xuống dưới hoặc thu gọn.
  - Mobile: 1 cột, panel cấu hình ở trên, preview ở dưới, history thành list.
- Card `Tạo video AI` trong `/apps` trỏ đến `/apps/video-generator`.

Không làm:
- Không tích hợp API tạo video thật.
- Không làm thay đổi UI của Image Generator trừ khi cần dùng chung style/helper.
- Không dùng màu tối làm chủ đạo như ảnh tham chiếu; chỉ học bố cục từ ảnh đó.

Done khi:
- `/apps/video-generator` hoạt động.
- Card video trong `/apps` mở được route mới.
- Bấm `Tạo video` thêm item video giả lập vào đầu history/list.
- Layout không vỡ ở desktop/tablet/mobile.
- `npm run build` pass.

## Task 3: Redesign Apps Library

Mục tiêu:
- Thiết kế lại trang `/apps` thành thư viện ứng dụng rõ ràng và hấp dẫn hơn.
- Lấy cảm hứng từ layout card "Phổ biến nhất" trong ảnh tham chiếu, nhưng giữ màu sáng theo theme hiện tại.
- Hiển thị các ứng dụng AI như một bộ công cụ tổng hợp: tạo ảnh, tạo video, chatbot, prompt, bảng giá/quản lý gói.

Phạm vi file:
- `app/apps/page.tsx`
- `features/apps/apps.data.ts`
- `features/apps/components/apps-library.tsx`
- `features/apps/components/apps-library.module.css`
- Có thể thêm nếu cần:
  - `features/apps/components/apps-card.tsx`
  - `features/apps/components/apps-section.tsx`

Yêu cầu:
- Header trang:
  - Eyebrow: `AI APPS`.
  - H1: `Ứng dụng AI`.
  - Mô tả ngắn: tổng hợp công cụ tạo ảnh, video, chatbot, prompt và quản lý gói.
- Section chính:
  - Tiêu đề: `Phổ biến nhất`.
  - Subtitle: `Các ứng dụng AI được dùng nhiều trong quy trình sáng tạo`.
  - Grid card ngang giống ảnh tham chiếu.
- Card ứng dụng:
  - Có preview visual ở trên với chiều cao cố định.
  - Có badge góc phải: `HOT`, `NEW`, `BETA`, hoặc `SOON`.
  - Có title, description tối đa 2 dòng.
  - Có CTA: `Dùng ngay`, `Mở ứng dụng`, hoặc `Sắp ra mắt`.
  - Hover state: nâng nhẹ card, tăng shadow, đổi border sang accent.
- Preview visual:
  - Không cần ảnh thật nếu chưa có asset.
  - Dùng CSS preview/pattern riêng cho từng app:
    - Image Generator: mini gallery pastel.
    - Video Generator: frame video + play button.
    - Chatbot: bubble hội thoại.
    - Prompt Library: document/template cards.
    - Pricing: mini pricing tiers.
- Data:
  - Mở rộng `features/apps/apps.data.ts` để mỗi app có:
    - `title`
    - `description`
    - `href`
    - `category`
    - `status`
    - `badge`
    - `ctaLabel`
    - `previewType`
  - Route thật hiện có phải được dùng đúng:
    - `/apps/image-generator`
    - `/apps/video-generator` nếu Task 2 đã tạo.
    - `/chatbot`
    - `/prompts`
    - `/pricing`
- Trạng thái coming soon:
  - App chưa có route hoặc chưa sẵn sàng vẫn hiện card.
  - CTA disabled hoặc label `Sắp ra mắt`.
  - Card không navigate nếu không có `href`.
- Màu sắc:
  - Không dùng nền tối như ảnh tham chiếu.
  - Nền trang dùng theme sáng hiện tại.
  - Card nền trắng, border nhẹ, shadow nhẹ.
  - Preview dùng màu pastel/gradient nhẹ theo theme.
  - CTA dùng `var(--navy)` hoặc accent tím hiện có.
- Responsive:
  - Desktop: 4 hoặc 5 card mỗi hàng tuỳ chiều rộng.
  - Tablet: 2 hoặc 3 card mỗi hàng.
  - Mobile: 1 card mỗi hàng.
  - Text không được tràn hoặc đè lên CTA.

Không làm:
- Không đổi màu chủ đạo sang dark theme.
- Không đổi layout shell/sidebar/top nav.
- Không thay đổi UI của Image Generator hoặc Video Generator ngoài việc cập nhật route/card trong `/apps`.
- Không tích hợp API thật.

Done khi:
- `/apps` hiển thị thư viện card mới.
- Card route hoạt động với các app đã có route.
- Card coming soon không gây lỗi navigation.
- Layout không vỡ ở desktop/tablet/mobile.
- `npm run build` pass.

## Task 4: Chuẩn hoá giao diện toàn bộ màn hình

Mục tiêu:
- Rà soát và chỉnh lại toàn bộ các màn hình còn lại để đồng bộ với điều kiện giao diện đã thống nhất.
- Giao diện chủ đạo luôn là màu sáng theo theme hiện tại.
- Layout phải bám vùng content chính, cân đối lề, không bị chơi vơi hoặc gom cụm lệch một phía.

Phạm vi file:
- `app/**/page.tsx`
- `features/home/**`
- `features/apps/**`
- `features/placeholder-pages/**`
- `features/app-shell/**`
- `shared/ui/**` nếu cần chỉnh icon/control dùng chung.

Yêu cầu chung:
- Giữ màu sáng hiện tại:
  - Nền tổng thể dùng `#ffffff`, `var(--surface)`, hoặc `var(--surface-soft)`.
  - Card/panel dùng nền trắng, viền nhẹ `rgba(0, 27, 68, 0.08)`.
  - Text chính dùng `var(--navy)`, text phụ dùng `var(--muted)`.
  - CTA dùng `var(--navy)` hoặc accent tím hiện có.
- Không dùng dark theme làm chủ đạo cho bất kỳ màn hình nào.
- Nội dung phải căn theo vùng content chính, không căn theo toàn viewport nếu có sidebar.
- Không để section bị `max-width` quá nhỏ khiến layout chơi vơi giữa màn.
- Các grid card phải tận dụng chiều rộng hợp lý:
  - Desktop tối đa 4 card mỗi hàng, trừ khi màn hình đó có lý do layout riêng.
  - Tablet 2-3 card mỗi hàng.
  - Mobile 1 card mỗi hàng.
- Các card cùng nhóm nên có chiều cao và spacing cân đối.
- Text trong card/button không được tràn hoặc đè lên nhau.
- Hover/focus/disabled states phải rõ ràng với button, link card và form control.
- Không thêm landing page marketing nếu màn hình là công cụ hoặc thư viện; ưu tiên giao diện có thể dùng được.

Màn hình cần rà soát:
- `/`
- `/apps`
- `/apps/image-generator`
- `/apps/video-generator` nếu đã có sau Task 2.
- `/chatbot`
- `/prompts`
- `/pricing`
- `/about`

Yêu cầu riêng:
- `/apps`:
  - Giữ điều kiện 1 hàng tối đa 4 app.
  - Card phải sát lề vùng content và cân đối.
- `/chatbot`, `/prompts`, `/pricing`:
  - Không dùng màn “Đang phát triển” lớn.
  - Phải có layout preview/use-case rõ ràng như các màn đã thiết kế.
- `/apps/image-generator`:
  - Giữ thanh prompt nổi và gallery preview hiện có nếu vẫn ổn.
  - Chỉ chỉnh nếu bị lệch, vỡ responsive, hoặc sai theme sáng.
- `/about`:
  - Nếu còn placeholder, chuyển sang trang giới thiệu sáng, gọn, có section rõ ràng.

Không làm:
- Không đổi route public nếu không được yêu cầu.
- Không tích hợp API thật.
- Không refactor logic không liên quan đến giao diện.
- Không thay đổi dữ liệu nghiệp vụ nếu không cần cho layout.

Done khi:
- Tất cả màn hình trên có giao diện sáng, cân đối, responsive.
- Không còn layout bị chơi vơi do `max-width` không hợp lý.
- Grid/card ở các màn hình liên quan tuân thủ tối đa 4 card mỗi hàng trên desktop.
- `npm run build` pass.

## Task 5: Thêm Script Analyzer

Mục tiêu:
- Thêm công cụ `Phân tích kịch bản` vào hệ sinh thái `/apps`.
- Tạo route `/apps/script-analyzer`.
- Xây dựng màn phân tích kịch bản có thể sử dụng được ở mức UI mô phỏng.
- Công cụ này hỗ trợ người dùng dán kịch bản, phân tích cấu trúc, nhịp kể, cảnh quay, hook, CTA và đề xuất tối ưu trước khi tạo video.

Phạm vi file:
- `app/apps/script-analyzer/page.tsx`
- `features/apps/apps.data.ts`
- `features/apps/tools/script-analyzer/components/script-analyzer-main-body.tsx`
- `features/apps/tools/script-analyzer/components/script-analyzer-main-body.module.css`
- Có thể thêm helper/type riêng trong:
  - `features/apps/tools/script-analyzer/`

Yêu cầu:
- Card `Phân tích kịch bản` trong `/apps` phải trỏ đến `/apps/script-analyzer`.
- Màn `/apps/script-analyzer` phải dùng giao diện màu sáng theo theme hiện tại.
- Layout desktop gồm 3 vùng:
  - Left panel: nhập kịch bản và cấu hình phân tích.
  - Center panel: kết quả phân tích chính.
  - Right panel: checklist/gợi ý tối ưu.
- Left panel:
  - Textarea lớn để dán kịch bản.
  - Select/chip cho loại nội dung: `Video ngắn`, `TVC`, `Review sản phẩm`, `Livestream`, `Kịch bản chatbot`.
  - Select/chip cho mục tiêu: `Tăng chuyển đổi`, `Giữ chân người xem`, `Kể chuyện`, `Giải thích sản phẩm`.
  - Input thời lượng mục tiêu.
  - Nút chính `Phân tích kịch bản`.
- Center panel:
  - Trạng thái rỗng đẹp khi chưa phân tích.
  - Sau khi bấm phân tích, hiển thị:
    - Điểm tổng quan giả lập.
    - Tóm tắt kịch bản.
    - Cấu trúc 3 phần: `Hook`, `Thân nội dung`, `CTA`.
    - Timeline cảnh quay theo từng đoạn.
    - Cảnh báo điểm yếu: mở đầu dài, CTA chưa rõ, thiếu nhịp chuyển cảnh, v.v.
- Right panel:
  - Checklist tối ưu.
  - Gợi ý prompt tạo video từ kịch bản.
  - Nút `Sao chép prompt video`.
  - Danh sách phiên bản phân tích gần đây.
- Tương tác:
  - Không gọi API thật.
  - Khi người dùng bấm `Phân tích kịch bản`, tạo kết quả mô phỏng dựa trên nội dung textarea.
  - Nếu textarea rỗng, disable nút phân tích.
  - Có trạng thái active/hover/focus/disabled rõ ràng.
- Responsive:
  - Desktop: 3 cột.
  - Tablet: left panel + center, right panel xuống dưới.
  - Mobile: 1 cột, input ở trên, kết quả ở dưới.

Không làm:
- Không tích hợp AI/API thật.
- Không đổi route ngoài `/apps/script-analyzer`.
- Không thay đổi UI Image Generator hoặc Video Generator.
- Không dùng dark theme làm chủ đạo.

Done khi:
- `/apps/script-analyzer` hoạt động.
- Card `Phân tích kịch bản` trong `/apps` mở được route mới.
- Bấm `Phân tích kịch bản` tạo kết quả mô phỏng.
- Layout không vỡ ở desktop/tablet/mobile.
- `npm run build` pass.

## Task 6: Thêm Workspace History dùng chung

Mục tiêu:
- Tạo khu vực lịch sử kết quả dùng chung cho các công cụ AI.
- Người dùng có thể xem lại ảnh, video, prompt, phân tích kịch bản đã tạo ở một nơi.
- Chuẩn bị nền tảng UI để sau này nối dữ liệu thật từ backend/local storage.

Phạm vi file:
- `app/history/page.tsx`
- `features/history/components/history-main-body.tsx`
- `features/history/components/history-main-body.module.css`
- `features/app-shell/shell-navigation.ts`
- `shared/types/navigation.ts`
- Có thể thêm:
  - `features/history/history.data.ts`

Yêu cầu:
- Thêm route `/history`.
- Thêm menu sidebar/top nav nếu phù hợp: `Lịch sử`.
- Giao diện màu sáng, bám vùng content chính.
- Layout gồm:
  - Header: `Lịch sử tạo nội dung`.
  - Filter bar: loại nội dung (`Ảnh`, `Video`, `Prompt`, `Kịch bản`), thời gian, trạng thái.
  - Search input.
  - Grid/list kết quả.
- Mỗi item lịch sử hiển thị:
  - Loại nội dung.
  - Thumbnail/preview giả lập.
  - Prompt hoặc tiêu đề.
  - Ngày tạo.
  - Action: xem lại, sao chép prompt, xoá.
- Dữ liệu ban đầu dùng mock data trong file local.
- Responsive:
  - Desktop: filter sidebar hoặc toolbar + grid 3-4 cột.
  - Mobile: filter dạng chips, list 1 cột.

Không làm:
- Không tích hợp backend thật.
- Không lưu dữ liệu thật nếu chưa có yêu cầu.
- Không thay đổi logic tạo ảnh/video hiện tại.

Done khi:
- `/history` hoạt động.
- Navigation mở được `/history`.
- Có mock history đủ 4 loại nội dung.
- Layout không vỡ desktop/tablet/mobile.
- `npm run build` pass.

## Task 7: Thêm Prompt Template Builder dùng chung

Mục tiêu:
- Xây dựng màn tạo và quản lý template prompt dùng chung cho Image Generator, Video Generator, Chatbot và Script Analyzer.
- Giúp người dùng tự tạo template có biến động như `{product}`, `{style}`, `{platform}`.

Phạm vi file:
- `app/templates/page.tsx`
- `features/templates/components/templates-main-body.tsx`
- `features/templates/components/templates-main-body.module.css`
- `features/templates/templates.data.ts`
- `features/app-shell/shell-navigation.ts`
- `shared/types/navigation.ts`

Yêu cầu:
- Thêm route `/templates`.
- Thêm menu `Templates` hoặc `Mẫu prompt`.
- Giao diện màu sáng theo theme hiện tại.
- Layout gồm 3 vùng:
  - Left: danh sách template và category.
  - Center: editor template.
  - Right: preview prompt sau khi điền biến.
- Template editor:
  - Input tên template.
  - Select loại template: `Ảnh`, `Video`, `Chatbot`, `Kịch bản`, `Nội dung`.
  - Textarea nội dung template.
  - Khu vực biến: thêm/xoá biến như `product`, `tone`, `audience`, `duration`.
  - Button `Lưu template`, `Tạo bản xem trước`.
- Preview:
  - Hiển thị prompt hoàn chỉnh sau khi thay biến bằng giá trị mẫu.
  - Có nút `Sao chép prompt`.
- Dữ liệu dùng mock/local state, chưa cần persistence.
- Responsive:
  - Desktop: 3 cột.
  - Tablet: list + editor, preview xuống dưới.
  - Mobile: 1 cột.

Không làm:
- Không cần tích hợp database.
- Không cần đồng bộ template sang các tool thật nếu chưa có task riêng.
- Không đổi UI các tool hiện tại ngoài navigation.

Done khi:
- `/templates` hoạt động.
- Có thể chọn template mock, chỉnh nội dung, tạo preview mô phỏng.
- Navigation mở được `/templates`.
- Layout không vỡ desktop/tablet/mobile.
- `npm run build` pass.
