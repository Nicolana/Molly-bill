import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthProvider from "@/components/AuthProvider";
import TopNavigation from "@/components/TopNavigation";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Molly Bill - AI智能记账系统",
  description: "基于人工智能的智能记账应用，自动识别交易类型，智能分析消费趋势，帮助您更好地管理个人财务。",
  keywords: "记账,AI,财务管理,智能分类,预算管理",
  authors: [{ name: "Molly Bill Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Molly Bill",
    startupImage: [
      {
        url: "/icons/apple-touch-icon.svg",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  openGraph: {
    title: "Molly Bill - AI智能记账系统",
    description: "基于人工智能的智能记账应用，让财务管理更简单",
    type: "website",
    locale: "zh_CN",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  other: {
    // 禁用浏览器的自动完成和表单填充
    'autocomplete': 'off',
    'form-detection': 'telephone=no,address=no,email=no',
    // PWA 相关 meta 标签
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Molly Bill',
    'application-name': 'Molly Bill',
    'msapplication-TileColor': '#3b82f6',
    'theme-color': '#3b82f6',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 支持动态视口高度，改善键盘弹出体验
  viewportFit: "cover",
  // 防止iOS Safari在键盘弹出时缩放
  interactiveWidget: "resizes-content",
  // PWA 相关视口设置
  themeColor: "#3b82f6",
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
            <TopNavigation />
            {children}
          </AuthProvider>
        </ErrorBoundary>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
