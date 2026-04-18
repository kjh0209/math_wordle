import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mathdle — 수학 방정식 워들",
    template: "%s | Mathdle",
  },
  description:
    "Wordle 스타일의 수학 방정식 퍼즐 게임. 매일 새로운 수식을 맞혀보세요!",
  keywords: ["수학", "워들", "퍼즐", "게임", "방정식", "수식"],
  openGraph: {
    title: "Mathdle — 수학 방정식 워들",
    description: "Wordle 스타일의 수학 방정식 퍼즐 게임",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head />
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
