import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScriptSmith — Selling-content scripts",
  description:
    "Generate ready-to-post Indonesian selling scripts, music picks, and video prompts for TikTok, Reels, and Shorts.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header session={session} />
        {children}
      </body>
    </html>
  );
}
