import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "五行壁纸生成",
  description: "根据生日、八字和五行生成 AI 手机壁纸",
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

