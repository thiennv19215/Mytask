import type { NavItem } from "@/shared/types/navigation";

export const navItems: NavItem[] = [
  { key: "home", label: "Trang chủ", icon: "home" },
  { key: "tools", label: "Công cụ AI", icon: "card" },
  { key: "chatbotPrompt", label: "Chatbot Prompt", icon: "chat" },
  { key: "freePrompts", label: "Prompt miễn phí", icon: "doc" },
  { key: "pricing", label: "Bảng giá", icon: "wallet" },
  { key: "about", label: "Giới thiệu", icon: "info" }
];

export const topNavItems: Array<Pick<NavItem, "key" | "label">> = [
  { key: "home", label: "Trang chủ" },
  { key: "tools", label: "Công cụ AI" },
  { key: "chatbotPrompt", label: "Chatbot Prompt" },
  { key: "pricing", label: "Bảng giá" }
];
