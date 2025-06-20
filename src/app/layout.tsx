import type { Metadata } from "next";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: "OKR管理システム",
  description: "チームと個人のOKR（目標と成果指標）を管理するシステム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
