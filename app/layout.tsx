import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI STUDIO - Trang chủ",
  description: "Nền tảng AI sáng tạo nội dung, hình ảnh, video và chatbot."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
