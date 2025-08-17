import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalAuthProvider from "@/components/ConditionalAuthProvider";
import Script from "next/script";
import Footer from "@/components/Footer"; // フッターコンポーネントをインポート

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI-Mon Quiz Application",
  description: "クイズアプリケーション - 問題作成・受験・成績管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;

  return (
    <html lang="ja" className="h-full">
      <head>
        <Script src="/contents/js/apiClient.js" strategy="beforeInteractive" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {ga4Id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}');
              `}
            </Script>
          </>
        )}
        <ConditionalAuthProvider className="flex-grow">
          {children}
        </ConditionalAuthProvider>
        <Footer />
      </body>
    </html>
  );
}
