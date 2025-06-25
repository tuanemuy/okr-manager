import type { Metadata } from "next";

import NextTopLoader from "nextjs-toploader";
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
      <NextTopLoader />
      <body>{children}</body>
    </html>
  );
}
