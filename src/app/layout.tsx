import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "五行壁纸生成",
  description: "根据生辰与当前时间生成 AI 五行壁纸",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
