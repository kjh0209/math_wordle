import "./globals.css";

export const metadata = {
  title: "Mathle",
  description: "수식으로 추론하는 수학 퍼즐 게임"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
