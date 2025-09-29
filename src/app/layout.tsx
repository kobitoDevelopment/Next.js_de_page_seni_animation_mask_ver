import type { Metadata } from "next";
import "./globals.css";
import { TransitionWrapper } from "@/components/TransitionWrapper";

export const metadata: Metadata = {
  title: "Page Transition Demo",
  description: "CSS clip-path page transition animation demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <TransitionWrapper>
          {children}
        </TransitionWrapper>
      </body>
    </html>
  );
}