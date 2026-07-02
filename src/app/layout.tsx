import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { APP_ICON_PATHS } from "@/lib/app-icons";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Document Tracker",
  description: "Submit reports with QR codes and track documents",
  applicationName: "OCRS Document Tracker",
  appleWebApp: {
    capable: true,
    title: "OCRS",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: APP_ICON_PATHS.favicon32, sizes: "32x32", type: "image/png" },
      { url: APP_ICON_PATHS.icon192, sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: APP_ICON_PATHS.icon180, sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a3f6f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
