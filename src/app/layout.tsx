import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScriptSmith — AI selling-content scripts",
  description:
    "Generate ready-to-post Indonesian selling scripts, music picks, and AI video prompts for TikTok, Reels, and Shorts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
