import type { AppsIconName } from "./components/apps-icons";

export type ToolStatus = "available" | "beta" | "comingSoon";

export type ToolCategory = "content" | "image" | "video";

export type ToolBadge = "HOT" | "NEW" | "BETA" | "SOON";

export type PreviewType = "image" | "video" | "product" | "script";

export type AppsTool = {
  title: string;
  description: string;
  href?: string;
  category: ToolCategory;
  status: ToolStatus;
  badge: ToolBadge;
  ctaLabel: string;
  previewType: PreviewType;
  icon: AppsIconName;
};

export const appsTools: AppsTool[] = [
  {
    title: "Tạo ảnh AI",
    description: "Biến ý tưởng thành hình ảnh sản phẩm, mockup và visual chiến dịch trong vài bước.",
    href: "/apps/image-generator",
    category: "image",
    status: "available",
    badge: "HOT",
    ctaLabel: "Mở công cụ",
    previewType: "image",
    icon: "image"
  },
  {
    title: "Tạo video AI",
    description: "Dùng khung hình, prompt và motion control để tạo preview video ngắn.",
    href: "/apps/video-generator",
    category: "video",
    status: "available",
    badge: "NEW",
    ctaLabel: "Mở công cụ",
    previewType: "video",
    icon: "video"
  },
  {
    title: "Làm video product",
    description: "Tạo kịch bản review sản phẩm, cảnh quay và bản dựng video bán hàng ngắn.",
    href: "/apps/product-video",
    category: "video",
    status: "beta",
    badge: "NEW",
    ctaLabel: "Mở công cụ",
    previewType: "product",
    icon: "video"
  },
  {
    title: "Phân tích kịch bản",
    description: "Chấm điểm hook, cấu trúc, nhịp kể, CTA và tạo gợi ý tối ưu trước khi làm video.",
    href: "/apps/script-analyzer",
    category: "content",
    status: "beta",
    badge: "NEW",
    ctaLabel: "Mở công cụ",
    previewType: "script",
    icon: "file"
  }
];
