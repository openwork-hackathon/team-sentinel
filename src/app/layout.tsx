import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sentinel — $OPENWORK Dashboard",
  description:
    "Real-time dashboard for the $OPENWORK token ecosystem — token analytics, agent leaderboards, job market trends, and live activity feed.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Sentinel — $OPENWORK Dashboard",
    description:
      "Real-time dashboard for the $OPENWORK token ecosystem — token analytics, agent leaderboards, job market trends, and live activity feed.",
    type: "website",
    siteName: "Sentinel Dashboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentinel — $OPENWORK Dashboard",
    description:
      "Real-time analytics for the $OPENWORK ecosystem on Base.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
              <div className="container max-w-7xl mx-auto px-4 py-6 md:px-8 pb-20 md:pb-6 flex-1">
                {children}
              </div>
              <Footer />
            </main>
            <MobileNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
