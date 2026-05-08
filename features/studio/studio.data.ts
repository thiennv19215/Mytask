export type ToolStatus = "available" | "beta" | "comingSoon";

export type ToolCategory = "content" | "image" | "video" | "automation";

export type StudioTool = {
  title: string;
  description: string;
  status: ToolStatus;
  category: ToolCategory;
  usage: string;
  icon: "pen" | "image" | "video" | "file" | "calendar" | "spark";
};

export const studioTools: StudioTool[] = [
  {
    title: "Tạo ảnh AI",
    description: "Biến ý tưởng văn bản thành hình ảnh nghệ thuật, mockup hoặc visual cho chiến dịch.",
    status: "available",
    category: "image",
    usage: "Sẵn sàng tạo ảnh",
    icon: "image"
  },
  {
    title: "Tạo video AI",
    description: "Tạo cảnh, chuyển động và hiệu ứng điện ảnh từ prompt hoặc kịch bản ngắn.",
    status: "comingSoon",
    category: "video",
    usage: "Sắp ra mắt",
    icon: "video"
  }
];
