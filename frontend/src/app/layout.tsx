import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Molly Bill - AI智能记账系统",
  description: "基于人工智能的智能记账应用，自动识别交易类型，智能分析消费趋势，帮助您更好地管理个人财务。",
  keywords: "记账,AI,财务管理,智能分类,预算管理",
  authors: [{ name: "Molly Bill Team" }],
  openGraph: {
    title: "Molly Bill - AI智能记账系统",
    description: "基于人工智能的智能记账应用，让财务管理更简单",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}
