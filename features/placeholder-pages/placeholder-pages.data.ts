import type { IconName, PageKey } from "@/shared/types/navigation";

type PlaceholderPageKey = Exclude<PageKey, "home">;

export type PlaceholderPageCopy = {
  label: string;
  heading: string;
  subtext: string;
  panelDescription: string;
  icon: IconName;
  cards: Array<{ title: string; description: string }>;
};

export const placeholderPages: Record<PlaceholderPageKey, PlaceholderPageCopy> = {
  resources: {
    label: "TÀI NGUYÊN",
    heading: "Tài nguyên",
    subtext:
      "Kho lưu trữ toàn bộ ảnh và video đã tạo từ các công cụ AI trong hệ thống.",
    panelDescription:
      "Trang Tài nguyên dùng để quản lý, xem lại, tải xuống và tái sử dụng media đã tạo.",
    icon: "doc",
    cards: [
      { title: "Ảnh đã tạo", description: "Lưu ảnh sản phẩm, banner, mockup và visual từ công cụ tạo ảnh AI." },
      { title: "Video đã tạo", description: "Lưu video product, video social và bản dựng từ công cụ tạo video AI." },
      { title: "Tải xuống", description: "Tải lại media đã tạo để đăng tải hoặc chỉnh sửa tiếp." },
      { title: "Quản lý media", description: "Tìm kiếm, lọc và sắp xếp tài nguyên theo loại tệp hoặc công cụ tạo." }
    ]
  },
  tools: {
    label: "CÔNG CỤ AI",
    heading: "Công cụ AI",
    subtext:
      "Tập hợp các công cụ giúp bạn tạo nội dung, hình ảnh, video và tự động hóa quy trình sáng tạo bằng AI.",
    panelDescription:
      "Các công cụ AI đang được hoàn thiện. Bạn có thể xem trước cấu trúc tính năng bên dưới và quay lại khi phiên bản đầu tiên sẵn sàng.",
    icon: "spark",
    cards: [
      { title: "Tạo ảnh AI", description: "Tạo ảnh từ prompt, ý tưởng hoặc mô tả sản phẩm." },
      { title: "Tạo video AI", description: "Biến kịch bản ngắn thành video, cảnh quay và nội dung social." },
      { title: "Viết nội dung AI", description: "Tạo caption, bài viết, hook và nội dung quảng cáo nhanh hơn." },
      { title: "Tự động hóa nội dung", description: "Thiết lập quy trình tạo nội dung lặp lại cho nhiều kênh." }
    ]
  },
  chatbotPrompt: {
    label: "CHATBOT PROMPT",
    heading: "Chatbot Prompt",
    subtext: "Tạo, lưu và tối ưu prompt cho chatbot AI theo từng mục tiêu sử dụng.",
    panelDescription:
      "Khu vực Chatbot Prompt đang được hoàn thiện. Bạn có thể xem trước các nhóm prompt dự kiến bên dưới.",
    icon: "chat",
    cards: [
      {
        title: "Prompt bán hàng",
        description: "Tạo prompt hỗ trợ tư vấn sản phẩm, xử lý phản hồi và chốt đơn."
      },
      {
        title: "Prompt chăm sóc khách hàng",
        description: "Chuẩn hóa câu trả lời, phân loại yêu cầu và hỗ trợ khách hàng nhanh hơn."
      },
      {
        title: "Prompt tư vấn tự động",
        description: "Thiết kế luồng hội thoại cho tư vấn, hỏi đáp và gợi ý giải pháp."
      },
      {
        title: "Prompt huấn luyện chatbot",
        description: "Xây dựng bộ prompt nền để chatbot trả lời đúng giọng thương hiệu."
      }
    ]
  },
  promptLibrary: {
    label: "THƯ VIỆN PROMPT",
    heading: "Thư viện Prompt",
    subtext:
      "Thư viện prompt giúp bạn bắt đầu nhanh với viết nội dung, tạo hình ảnh, chatbot và quảng cáo.",
    panelDescription:
      "Thư viện Prompt đang được hoàn thiện. Bạn có thể xem trước các nhóm prompt miễn phí và template dự kiến bên dưới.",
    icon: "doc",
    cards: [
      {
        title: "Prompt viết nội dung",
        description: "Gợi ý prompt cho caption, bài viết, email, mô tả sản phẩm và nội dung social."
      },
      {
        title: "Prompt tạo hình ảnh",
        description: "Bộ prompt giúp tạo ảnh sản phẩm, ảnh quảng cáo, concept art và hình minh họa."
      },
      {
        title: "Prompt quảng cáo",
        description: "Tạo hook, headline, angle bán hàng và nội dung quảng cáo cho nhiều nền tảng."
      },
      {
        title: "Prompt chatbot",
        description: "Prompt mẫu cho tư vấn tự động, chăm sóc khách hàng và trả lời theo thương hiệu."
      }
    ]
  },
  about: {
    label: "GIỚI THIỆU",
    heading: "Giới thiệu",
    subtext:
      "Tìm hiểu về nền tảng, định hướng sản phẩm và cách AI APPS hỗ trợ quy trình sáng tạo AI.",
    panelDescription:
      "Trang giới thiệu đang được hoàn thiện. Bạn có thể xem trước cấu trúc nội dung dự kiến bên dưới.",
    icon: "info",
    cards: [
      { title: "Sứ mệnh", description: "Giúp mọi người tạo nội dung AI nhanh, dễ dùng và có chất lượng cao." },
      { title: "Nền tảng", description: "Tập trung vào công cụ tạo ảnh, video, prompt và chatbot cho creator." },
      { title: "Lộ trình sản phẩm", description: "Các tính năng mới sẽ được mở dần theo từng nhóm công cụ." },
      { title: "Hỗ trợ người dùng", description: "Tài liệu, hướng dẫn và template sẽ được bổ sung trong các phiên bản tới." }
    ]
  },
  pricing: {
    label: "BẢNG GIÁ",
    heading: "Bảng giá",
    subtext:
      "Các gói sử dụng cho creator, đội nhóm và doanh nghiệp sẽ được mở khi bộ công cụ chính hoàn thiện.",
    panelDescription:
      "Bảng giá đang được hoàn thiện. Mục này sẽ hiển thị quyền lợi từng gói, giới hạn sử dụng, ưu đãi và lựa chọn nâng cấp.",
    icon: "card",
    cards: [
      {
        title: "Gói miễn phí",
        description: "Dùng thử các công cụ cơ bản, prompt mẫu và một phần thư viện nội dung."
      },
      {
        title: "Gói Creator",
        description: "Tăng hạn mức tạo ảnh, video, chatbot prompt và lưu lịch sử làm việc."
      },
      {
        title: "Gói Team",
        description: "Không gian làm việc nhóm, chia sẻ template và quản lý tài nguyên chung."
      },
      {
        title: "Gói Business",
        description: "Quyền lợi nâng cao, hỗ trợ ưu tiên và tùy chỉnh theo nhu cầu doanh nghiệp."
      }
    ]
  }
};
