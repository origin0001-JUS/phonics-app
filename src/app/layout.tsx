import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google"; // Even more rounded and playful for kids
import "./globals.css";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import ThemeInitializer from "./ThemeInitializer";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "소리로 읽는 영어 300",
  description: "Phonics & Essential Vocabulary for Kids",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "소리영어300",
  },
};

export const viewport: Viewport = {
  themeColor: "#7dd3fc", // Sky blue
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${fredoka.variable} antialiased font-sans bg-sky-300 dark:bg-slate-900 text-slate-800 dark:text-slate-200 touch-pan-y`}
      >
        <ServiceWorkerRegister />
        <ThemeInitializer />
        <div className="mx-auto max-w-md w-full min-h-[100dvh] bg-gradient-to-b from-[#8fdfff] to-[#d8f4ff] dark:from-[#1e293b] dark:to-[#0f172a] relative overflow-hidden flex flex-col shadow-2xl ring-1 ring-black/5">
          {/* Background Decor: Clouds */}
          <div className="absolute top-10 -left-6 w-24 h-12 bg-white dark:bg-slate-700 rounded-full opacity-80 dark:opacity-30 blur-[2px]"></div>
          <div className="absolute top-24 -right-10 w-32 h-16 bg-white dark:bg-slate-700 rounded-full opacity-80 dark:opacity-30 blur-[2px]"></div>

          {children}

          {/* Background Decor: Bottom Grass (simulated with CSS) */}
          <div className="absolute bottom-0 w-full h-32 bg-[#a3da61] dark:bg-[#2d4a1e] rounded-t-[100%] scale-x-150 transform translate-y-16 pointer-events-none z-0 border-t-8 border-[#8bc34a] dark:border-[#3d6b2a]"></div>
        </div>
      </body>
    </html>
  );
}
