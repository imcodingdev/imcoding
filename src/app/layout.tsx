import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Link from "next/link";
import { BackendProvider } from "@/components/BackendProvider";
import { AuthButton } from "@/components/AuthButton";
import { SettingsLink } from "@/components/SettingsLink";
import { LoginErrorBanner } from "@/components/LoginErrorBanner";
import { Logo } from "@/components/Logo";
import { HeaderProgress } from "@/components/HeaderProgress";
import { loadConcepts } from "@/lib/concepts/load";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500"],
  preload: false,
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "ImCoding",
  description: "Hiểu code AI viết cho bạn, từ nền tảng",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export default function RootLayout({ children }: LayoutProps<"/">) {
  const ids = loadConcepts().map((c) => c.id);
  return (
    <html
      lang="vi"
      className={`${plusJakarta.variable} ${beVietnam.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas font-sans text-base text-ink selection:bg-accent-soft selection:text-accent">
        <BackendProvider>
          <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:px-4 md:px-6">
              <nav aria-label="Điều hướng chính" className="flex items-center gap-0 sm:gap-1 md:gap-4">
                <Link
                  href="/"
                  className={`inline-flex min-h-[44px] items-center rounded-lg px-1 ${focusRing}`}
                >
                  <Logo withText />
                </Link>
                <Link
                  href="/map"
                  className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-lg px-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink md:text-base ${focusRing}`}
                >
                  Bản đồ
                </Link>
              </nav>
              <div className="flex items-center gap-0 sm:gap-1 md:gap-4">
                <HeaderProgress total={ids.length} ids={ids} />
                <SettingsLink />
                <AuthButton />
              </div>
            </div>
          </header>
          <Suspense fallback={null}>
            <LoginErrorBanner />
          </Suspense>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-line bg-surface-muted">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4 text-sm text-ink-muted md:px-6">
              <p>ImCoding · Hiểu code AI viết cho bạn, từ nền tảng.</p>
              <Link
                href="/privacy"
                className={`inline-flex min-h-[44px] items-center rounded-lg px-1 underline underline-offset-4 hover:text-ink ${focusRing}`}
              >
                Quyền riêng tư
              </Link>
            </div>
          </footer>
        </BackendProvider>
      </body>
    </html>
  );
}
