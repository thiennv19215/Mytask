export type PageKey =
  | "home"
  | "tools"
  | "resources"
  | "chatbotPrompt"
  | "promptLibrary"
  | "about"
  | "pricing";

export type IconName = "home" | "card" | "chat" | "doc" | "wallet" | "info" | "star" | "spark";

export type NavItem = {
  key: PageKey;
  label: string;
  href: string;
  icon: IconName;
};
