import type { Metadata } from "next";
import "./globals.css";
import "../styles/site.css";

export const metadata: Metadata = {
  title: "Mohamed Shehata",
  description:
    "Mohamed Shehata — Head of UX, UX & Product Design Leader with 23+ years building world-class digital products across the GCC.",
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/assets/hero-orange.jpg" as="image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
