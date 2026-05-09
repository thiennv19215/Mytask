import type { NavItem } from "@/shared/types/navigation";

export const navItems: NavItem[] = [
  { key: "home", label: "Trang chủ", href: "/", icon: "home" },
  { key: "tools", label: "Ứng dụng AI", href: "/apps", icon: "card" },
  { key: "resources", label: "Tài nguyên", href: "/resources", icon: "doc" },
  { key: "chatbotPrompt", label: "Chatbot", href: "/chatbot", icon: "chat" },
  { key: "promptLibrary", label: "Thư viện Prompt", href: "/prompts", icon: "doc" },
  { key: "pricing", label: "Bảng giá", href: "/pricing", icon: "wallet" },
  { key: "about", label: "Giới thiệu", href: "/about", icon: "info" }
];

export const topNavItems: Array<Pick<NavItem, "key" | "label" | "href">> = [
  { key: "home", label: "Trang chủ", href: "/" },
  { key: "tools", label: "Ứng dụng AI", href: "/apps" },
  { key: "resources", label: "Tài nguyên", href: "/resources" },
  { key: "chatbotPrompt", label: "Chatbot", href: "/chatbot" },
  { key: "pricing", label: "Bảng giá", href: "/pricing" }
];
