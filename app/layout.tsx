import type { Metadata } from "next";
import { AppShell } from "@/features/app-shell/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI APPS - Trang chủ",
  description: "Nền tảng AI sáng tạo nội dung, hình ảnh, video và chatbot."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
