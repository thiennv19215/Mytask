export type PageKey = "home" | "tools" | "chatbotPrompt" | "freePrompts" | "about" | "pricing";

export type IconName = "home" | "card" | "chat" | "doc" | "wallet" | "info" | "star" | "spark";

export type NavItem = {
  key: PageKey;
  label: string;
  icon: IconName;
};
