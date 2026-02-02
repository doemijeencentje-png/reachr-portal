import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import BackgroundEffects from "@/components/ui/BackgroundEffects";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reachr - Client Portal",
  description: "Manage your automated SEO content generation. Connect WordPress, monitor workflows, and track your blog posts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-white text-gray-900`}
      >
        <BackgroundEffects />
        {children}
      </body>
    </html>
  );
}
